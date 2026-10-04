import { randomUUID } from 'node:crypto';
import { domainOf, providerRegistry } from './providers.js';
import { demoCompare } from './adapters/demo.js';
import { monetaryAction } from './paymentGuard.js';

export const blockedSecrets = /\b(password|otp|one[- ]?time password|pin|cvv|net ?banking|bank login)\b/i;
export const consequentialAction = /\b(apply|book|buy|purchase|send|delete|post|submit|pay|cancel|confirm|schedule|reserve|order)\b/i;

export function createComparison(request) {
  const domain = domainOf(request);
  const providers = providerRegistry[domain] || [];
  const results = demoCompare(domain);
  return {
    domain,
    request,
    providers,
    results,
    recommendation: results[0] || null,
    dataMode: providers.some(p => p.live) ? 'mixed' : 'demo',
    disclaimer: 'Live provider data is used only after an approved connector is configured.'
  };
}

export function createApproval(instruction, comparison) {
  return {
    id: randomUUID(),
    instruction,
    domain: comparison.domain,
    status: 'pending',
    createdAt: new Date().toISOString(),
    recommendedProvider: comparison.recommendation?.provider || null,
    execution: 'waiting_for_user',
    maySpendMoney: monetaryAction.test(instruction),
    paymentPolicy: monetaryAction.test(instruction) ? 'fresh_confirmation_required_before_any_charge' : 'not_applicable'
  };
}
