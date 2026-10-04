# Payment Safety Contract

This is a non-negotiable Jarvis product rule.

## Rule
Jarvis must never complete a monetary transaction automatically. Every charge, including INR 1, requires a fresh explicit user confirmation immediately before the provider commit/charge step.

## Two separate approvals
1. **Action approval** — permission to proceed with a consequential action such as preparing a booking/order.
2. **Payment confirmation** — permission for one exact provider, currency and amount immediately before money is committed.

Approving an action never implies approving its payment.

## Backend enforcement
The payment guard lives in `apps/api/src/paymentGuard.js` and is exposed through:

- `POST /api/payments/prepare`
- `POST /api/payments/:id/decision`
- `POST /api/payments/:id/consume`

A confirmation:
- is bound to an exact `provider`, `currency`, and `amountMinor`
- expires after two minutes
- is single-use
- becomes invalid if amount/provider/currency changes
- cannot be reused after consumption

Real provider connectors must call the consume guard immediately before the provider's irreversible charge/commit operation. No connector may implement an alternate payment path that bypasses this guard.

## Credentials
Jarvis must not collect or store CVV, OTP, PIN, bank-login passwords, or net-banking credentials. Payment methods should be represented only through non-sensitive metadata or provider-authorized tokens/sessions.
