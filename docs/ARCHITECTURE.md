# Jarvis architecture

Jarvis is outcome-first. The user asks for an outcome rather than selecting an app.

1. **Intent routing** identifies the domain (jobs, cabs, travel, movies, shopping, etc.).
2. **Provider registry** lists eligible provider connectors and their capabilities.
3. **Adapters** query providers using only permitted APIs/OAuth/deep links or other approved mechanisms.
4. **Normalizer** converts heterogeneous provider data into comparable results.
5. **Ranker** weighs price, time, fit, offers, user preferences, availability and policy constraints.
6. **Approval engine** gates consequential actions such as applying, booking, purchasing, sending or deleting.
7. **Execution adapter** performs the approved action and stores the provider receipt/state.
8. **Audit log** records what Jarvis did and why.

The current repository includes a demo adapter. It must not be confused with live provider data.

## Security principles
- Never collect OTP, PIN, CVV, banking passwords or provider passwords in Jarvis chat.
- Prefer OAuth/provider-authorized sessions.
- Keep provider secrets server-side only.
- Encrypt persistent secrets in a production secret manager/database.
- Require user approval before consequential external actions unless a future explicit automation policy authorizes a narrowly-scoped action.

## Mobile clients
`apps/mobile` is the Expo / React Native client for Android and iOS. It consumes the same `/api` contract as the React web client. Mobile-specific app-store configuration is isolated in `app.json` and `eas.json`.

## Payment guardrail
Payments are not a normal connector action. A connector must request a separate server-side payment confirmation immediately before a charge. The confirmation is exact, expiring, single-use and amount/provider/currency bound. See `PAYMENT_SAFETY.md`.
