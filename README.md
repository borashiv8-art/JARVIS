# Jarvis Personal AI OS

GitHub-ready foundation for an outcome-first personal AI assistant. Jarvis is designed to search across connected providers, normalize results, rank the best options, request approval for consequential actions and then execute through permitted provider connectors.

## Current state
This repository is deployable and the app/API work together. **Provider results are demo data until a real connector is implemented.** The code never claims that LinkedIn, Naukri, Uber, Ola, Rapido, BookMyShow, District, travel sites or shopping services are live-connected when they are not.

Included:
- React + Vite web app
- Expo / React Native mobile app for Android + iOS
- Node + Express API
- Provider registry and adapter architecture
- Outcome/domain routing
- Multi-provider comparison model
- Approval queue + audit log
- Persistent local JSON store for development
- Browser voice input where supported
- Explicit blocking of password / OTP / PIN / CVV collection
- Hard payment guard: no automatic payment of any amount; fresh exact confirmation required before every charge
- Docker deployment
- Render blueprint
- GitHub Actions build check
- Standalone UX demo under `/demo`

## Local run
Requirements: Node.js 22.13+ (mobile baseline uses Expo SDK 57)

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

API health: `http://localhost:8787/api/health`

## Production-like local run
```bash
npm install
npm run build
npm start
```

Then open `http://localhost:8787`. Express serves the built React app and `/api` from the same deployment.

## Docker
```bash
docker compose up --build
```
Open `http://localhost:8787`.

## Commit to GitHub
```bash
git init
git add .
git commit -m "Initial Jarvis platform foundation"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Where to add real integrations
Add one provider adapter at a time under:

`apps/api/src/adapters/`

Update its provider entry in `apps/api/src/providers.js` only when the connector is truly live.

A production connector should implement:
1. authorized connection/OAuth
2. provider query/search
3. normalized result mapping
4. capability declaration (search / compare / execute)
5. execution with an approved action ID
6. receipt/status reconciliation
7. error and rate-limit handling

## Recommended first real integrations
1. Gmail + Google Calendar (OAuth)
2. Job discovery connectors that are permitted by the provider
3. Travel search/deep-link connectors
4. Cab comparison/deep links where provider access permits it

## Production hardening before real users
Replace the JSON store with PostgreSQL, add user authentication, encrypted secrets/refresh tokens, CSRF/session controls as needed, rate limiting, structured logs, database migrations, background jobs/queues, connector health monitoring and a proper secrets manager.

See `docs/ARCHITECTURE.md`.

## Android + iOS app
A shared Expo / React Native mobile client is included under `apps/mobile`.

```bash
npm install
npm run mobile
```

The mobile app uses the same Jarvis API as the web client. Configure `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` before testing on a physical device or deploying.

For store builds and submission instructions, see `docs/MOBILE_RELEASE.md`.

## Hard payment rule
**Jarvis is not allowed to make an automatic payment of any amount. This includes INR 1.**

A consequential action and its payment are separate approvals. Immediately before a real charge, the backend creates a fresh payment confirmation bound to the exact provider, currency and amount. The confirmation expires quickly and can be consumed only once. If the amount or provider changes, a new confirmation is mandatory.

See `docs/PAYMENT_SAFETY.md` and `apps/api/src/paymentGuard.js`.
