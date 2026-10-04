import { randomUUID } from 'node:crypto';

// Monetary actions are intentionally broad. If an action may result in a charge,
// Jarvis treats it as payment-capable and requires a fresh payment confirmation
// immediately before any connector can commit the transaction.
export const monetaryAction = /\b(pay|payment|purchase|buy|book|booking|order|checkout|charge|transaction|transfer|send money|reserve|subscription|renew)\b/i;

export function createPaymentConfirmation({ amountMinor, currency = 'INR', provider, description, actionId = null }) {
  if (!Number.isInteger(amountMinor) || amountMinor < 1) {
    throw new Error('amountMinor must be an integer greater than 0');
  }
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 1000);
  return {
    id: randomUUID(),
    actionId,
    provider,
    description,
    currency,
    amountMinor,
    status: 'pending',
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    confirmedAt: null,
    consumedAt: null,
    oneTimeToken: null
  };
}

export function confirmPayment(payment) {
  if (payment.status !== 'pending') throw new Error('payment confirmation is not pending');
  if (Date.now() > Date.parse(payment.expiresAt)) {
    payment.status = 'expired';
    throw new Error('payment confirmation expired');
  }
  payment.status = 'confirmed';
  payment.confirmedAt = new Date().toISOString();
  payment.oneTimeToken = randomUUID();
  return payment;
}

export function rejectPayment(payment) {
  if (!['pending', 'confirmed'].includes(payment.status)) throw new Error('payment confirmation cannot be rejected');
  payment.status = 'rejected';
  payment.oneTimeToken = null;
  return payment;
}

export function consumePaymentConfirmation(payment, { token, amountMinor, currency, provider }) {
  if (payment.status !== 'confirmed') throw new Error('payment is not confirmed');
  if (Date.now() > Date.parse(payment.expiresAt)) {
    payment.status = 'expired';
    payment.oneTimeToken = null;
    throw new Error('payment confirmation expired');
  }
  if (!token || token !== payment.oneTimeToken) throw new Error('invalid one-time payment token');
  if (amountMinor !== payment.amountMinor || currency !== payment.currency || provider !== payment.provider) {
    throw new Error('payment details changed; fresh confirmation required');
  }
  payment.status = 'consumed';
  payment.consumedAt = new Date().toISOString();
  payment.oneTimeToken = null;
  return payment;
}

export function formatMoney(amountMinor, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amountMinor / 100);
}
