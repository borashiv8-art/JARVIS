import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { readStore, writeStore } from './store.js';
import { providerRegistry } from './providers.js';
import { blockedSecrets, consequentialAction, createApproval, createComparison } from './orchestrator.js';
import { createPaymentConfirmation, confirmPayment, rejectPayment, consumePaymentConfirmation, formatMoney } from './paymentGuard.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const webDist = path.join(repoRoot, 'apps', 'web', 'dist');
const now = () => new Date().toISOString();
const PORT = Number(process.env.PORT || 8787);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('tiny'));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

function audit(db, type, detail) {
  db.audit.unshift({ id: randomUUID(), type, detail, at: now() });
  db.audit = db.audit.slice(0, 300);
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Jarvis Orchestrator API', time: now() }));
app.get('/api/providers', (_req, res) => res.json(providerRegistry));
app.get('/api/dashboard', (_req, res) => {
  const db = readStore();
  res.json({
    profile: db.profile,
    connections: db.connections,
    tasks: db.tasks,
    approvals: db.approvals.filter(x => x.status === 'pending'),
    paymentConfirmations: (db.paymentConfirmations || []).filter(x => ['pending','confirmed'].includes(x.status)),
    audit: db.audit.slice(0, 40),
    messages: db.messages.slice(-80),
    registry: providerRegistry
  });
});

app.post('/api/compare', (req, res) => {
  const request = String(req.body?.request || '').trim();
  if (!request) return res.status(400).json({ error: 'request required' });
  if (blockedSecrets.test(request)) return res.status(400).json({ error: 'Jarvis does not collect passwords, OTPs, PINs or CVVs.' });
  const comparison = createComparison(request);
  const db = readStore();
  audit(db, 'comparison', { domain: comparison.domain, request, providers: comparison.providers.map(p => p.name), dataMode: comparison.dataMode });
  writeStore(db);
  res.json(comparison);
});

app.post('/api/chat', (req, res) => {
  const text = String(req.body?.message || '').trim();
  if (!text) return res.status(400).json({ error: 'message required' });
  const db = readStore();
  db.messages.push({ id: randomUUID(), role: 'user', text, at: now() });

  if (blockedSecrets.test(text)) {
    const message = { id: randomUUID(), role: 'assistant', text: 'I will not collect passwords, OTPs, PINs or CVVs. Connect services through approved authorization instead.', at: now() };
    db.messages.push(message); audit(db, 'blocked_secret_request', { text }); writeStore(db);
    return res.json({ message, blocked: true });
  }

  const comparison = createComparison(text);
  let response = `I routed this to ${comparison.domain}. I would check ${comparison.providers.map(p => p.name).join(', ') || 'available sources'}, normalize comparable results, remove duplicates and rank the best options.`;
  if (comparison.recommendation) response += ` Current demo recommendation: ${comparison.recommendation.provider} — ${comparison.recommendation.value}.`;
  let approval = null;
  if (consequentialAction.test(text)) {
    approval = createApproval(text, comparison);
    db.approvals.unshift(approval);
    response += ' I prepared the action, but execution waits for your approval.';
  }
  const message = { id: randomUUID(), role: 'assistant', text: response, at: now(), domain: comparison.domain, results: comparison.results };
  db.messages.push(message);
  audit(db, 'orchestrated', { domain: comparison.domain, text, approvalCreated: Boolean(approval), dataMode: comparison.dataMode });
  writeStore(db);
  res.json({ message, approval, ...comparison });
});

app.post('/api/approvals/:id/decision', (req, res) => {
  const db = readStore();
  const approval = db.approvals.find(x => x.id === req.params.id);
  if (!approval) return res.status(404).json({ error: 'approval not found' });
  const decision = req.body?.decision;
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'decision must be approved or rejected' });
  approval.status = decision;
  approval.decidedAt = now();
  approval.execution = decision === 'approved' ? 'connector_required' : 'not_executed';
  audit(db, 'approval_decision', { id: approval.id, decision, execution: approval.execution });
  writeStore(db);
  res.json(approval);
});



// HARD PAYMENT SAFETY RULE
// No connector is allowed to charge any amount without a fresh, exact, one-time
// payment confirmation. This applies to every amount, including INR 1.
app.post('/api/payments/prepare', (req, res) => {
  const amountMinor = Number(req.body?.amountMinor);
  const currency = String(req.body?.currency || 'INR').toUpperCase();
  const provider = String(req.body?.provider || '').trim();
  const description = String(req.body?.description || '').trim();
  const actionId = req.body?.actionId ? String(req.body.actionId) : null;
  if (!Number.isInteger(amountMinor) || amountMinor < 1) return res.status(400).json({ error: 'amountMinor must be an integer >= 1' });
  if (!provider || !description) return res.status(400).json({ error: 'provider and description required' });
  const db = readStore();
  db.paymentConfirmations ||= [];
  const payment = createPaymentConfirmation({ amountMinor, currency, provider, description, actionId });
  db.paymentConfirmations.unshift(payment);
  audit(db, 'payment_confirmation_prepared', { id: payment.id, provider, amountMinor, currency, actionId });
  writeStore(db);
  res.status(201).json({ ...payment, displayAmount: formatMoney(amountMinor, currency), oneTimeToken: undefined });
});

app.post('/api/payments/:id/decision', (req, res) => {
  const db = readStore();
  db.paymentConfirmations ||= [];
  const payment = db.paymentConfirmations.find(x => x.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'payment confirmation not found' });
  const decision = String(req.body?.decision || '');
  try {
    if (decision === 'confirmed') confirmPayment(payment);
    else if (decision === 'rejected') rejectPayment(payment);
    else return res.status(400).json({ error: 'decision must be confirmed or rejected' });
    audit(db, 'payment_confirmation_decision', { id: payment.id, decision, provider: payment.provider, amountMinor: payment.amountMinor, currency: payment.currency });
    writeStore(db);
    // The one-time token is returned only on explicit confirmation and must be
    // passed server-to-server to the connector immediately before the charge.
    res.json({ ...payment, displayAmount: formatMoney(payment.amountMinor, payment.currency) });
  } catch (e) {
    writeStore(db);
    res.status(409).json({ error: e.message, status: payment.status });
  }
});

app.post('/api/payments/:id/consume', (req, res) => {
  const db = readStore();
  db.paymentConfirmations ||= [];
  const payment = db.paymentConfirmations.find(x => x.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'payment confirmation not found' });
  try {
    consumePaymentConfirmation(payment, {
      token: String(req.body?.token || ''),
      amountMinor: Number(req.body?.amountMinor),
      currency: String(req.body?.currency || '').toUpperCase(),
      provider: String(req.body?.provider || '')
    });
    audit(db, 'payment_confirmation_consumed', { id: payment.id, provider: payment.provider, amountMinor: payment.amountMinor, currency: payment.currency });
    writeStore(db);
    res.json({ ok: true, status: payment.status });
  } catch (e) {
    writeStore(db);
    res.status(409).json({ error: e.message, status: payment.status });
  }
});

app.post('/api/connections', (req, res) => {
  const provider = String(req.body?.provider || '').trim();
  if (!provider) return res.status(400).json({ error: 'provider required' });
  const db = readStore();
  let connection = db.connections.find(x => x.provider.toLowerCase() === provider.toLowerCase());
  if (!connection) {
    connection = { id: randomUUID(), provider, status: 'connector_not_configured', createdAt: now() };
    db.connections.push(connection);
    audit(db, 'connection_placeholder_created', { provider });
    writeStore(db);
  }
  res.status(201).json(connection);
});

app.post('/api/cards', (req, res) => {
  const bank = String(req.body?.bank || '').trim();
  const product = String(req.body?.product || '').trim();
  if (!bank || !product) return res.status(400).json({ error: 'bank and product required' });
  const db = readStore();
  const card = { id: randomUUID(), bank, product };
  db.profile.cards.push(card);
  audit(db, 'non_sensitive_card_added', { bank, product });
  writeStore(db);
  res.status(201).json(card);
});

app.post('/api/tasks', (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title required' });
  const db = readStore();
  const task = { id: randomUUID(), title, status: 'open', createdAt: now() };
  db.tasks.unshift(task); audit(db, 'task_created', { id: task.id, title }); writeStore(db);
  res.status(201).json(task);
});

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`Jarvis API listening on http://0.0.0.0:${PORT}`));
