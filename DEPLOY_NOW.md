# JARVIS — DEPLOY NOW

This repository is the deployable MVP foundation for Jarvis Web + API + Android + iOS.

## What is real in this build
- Web UI + Node/Express API run together in one deployment.
- Jarvis intent routing, provider registry, comparison normalization scaffolding, approvals, tasks, audit log and non-sensitive card profile are implemented.
- A hard payment confirmation layer exists: no payment connector may consume a payment authorization unless the exact provider, currency and amount were freshly confirmed. This applies from the smallest supported monetary unit upward.
- Android/iOS client is included under `apps/mobile`.

## What is NOT live yet
Provider-specific integrations (LinkedIn/Naukri/Uber/Ola/Rapido/airlines/OTAs/movie ticketing/shopping/etc.) still need permitted API, OAuth, deep-link or provider-specific connector work. Demo comparison results must not be represented as live provider data.

This version is appropriate for your own hosted MVP testing. Before a public consumer launch, add production user authentication, a managed database, secrets management, privacy/terms screens, telemetry/monitoring and each provider integration's compliance review.

---

## 1. Put the code in GitHub

```bash
git init
git add .
git commit -m "Deployable Jarvis MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## 2. Deploy Web + API on Render

The repo contains `render.yaml` and a `Dockerfile`.

1. In Render, create a **Blueprint** from your GitHub repository.
2. Render reads `render.yaml` and creates the Docker web service.
3. The service health endpoint is `/api/health`.
4. A persistent disk is mounted at `/var/data` and MVP state is written to `/var/data/db.json`.
5. After deployment, open your Render URL. The React web app is served by the same Node service.

For local Docker testing:

```bash
docker build -t jarvis .
docker run --rm -p 8787:8787 -e PORT=8787 -e DATA_FILE=/app/data/db.local.json jarvis
```

Open: `http://localhost:8787`

## 3. Local development

Requires Node 22+.

```bash
npm install
npm run dev
```

Web normally runs at `http://localhost:5173` and API at `http://localhost:8787`.

## 4. Point the mobile app at the deployed API

The mobile app reads:

`EXPO_PUBLIC_API_URL`

Set it to:

`https://YOUR-DEPLOYED-DOMAIN/api`

Do not use `localhost` in a production mobile build.

## 5. Android / Google Play

```bash
npm install --global eas-cli
eas login
cd apps/mobile
eas build --platform android --profile production
```

The production EAS profile produces the Android App Bundle used by Google Play. After creating the app in Play Console and completing the required account/store setup:

```bash
eas submit --platform android
```

Use an internal testing track before production.

## 6. iPhone / App Store

From `apps/mobile`:

```bash
eas build --platform ios --profile production
```

Then:

```bash
eas submit --platform ios
```

The uploaded build appears in App Store Connect/TestFlight after Apple processing. Test it through TestFlight before App Review.

## 7. Payment safety rule — do not weaken this

Jarvis may autonomously search, compare, shortlist and prepare.

Jarvis must NOT autonomously authorize a monetary transaction.

The required payment flow is:

1. Jarvis chooses/prepares the provider action.
2. Backend creates an exact payment confirmation.
3. UI displays provider + purpose + exact amount + currency.
4. User explicitly confirms.
5. Backend issues a short-lived, one-time confirmation token.
6. Connector consumes that exact token immediately before the charge.
7. Any amount/provider/currency change invalidates that approval and requires a new confirmation.

Action approval and payment approval are deliberately separate.

## 8. Before public production

Do not treat the current local JSON persistence as a multi-user production database. Before opening Jarvis publicly, replace it with PostgreSQL or an equivalent managed database and implement authenticated user accounts/session binding. Payment approvals must be tied to the authenticated user/session/device and recorded in an immutable security audit trail.

Also add:
- OAuth/token vault for connected providers
- Privacy policy and Terms of Service
- Account deletion/data export flows
- Store screenshots/metadata
- Error monitoring and rate limiting
- Provider-specific terms/compliance checks
- Real connector integration tests

