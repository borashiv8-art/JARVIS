# Mobile release — Android and iOS

The mobile app is under `apps/mobile` and uses Expo / React Native so one codebase can ship to Google Play and the Apple App Store.

## Current baseline (October 2026)
- Expo SDK 57 stable
- Android target/compile SDK 36 through Expo SDK 57
- iOS production builds through current EAS/Xcode toolchains

Before a real store submission, re-check the current Google Play and Apple submission requirements because store policies change.

## Configure API
Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://your-jarvis-api.example.com/api
```

For local testing:
- Android emulator: `http://10.0.2.2:8787/api`
- iOS simulator: `http://localhost:8787/api`
- Physical phone: use your computer's LAN IP or a deployed HTTPS API.

## Run locally
From the repository root:

```bash
npm install
npm run dev
```

In another terminal:

```bash
npm run mobile
```

## EAS setup
Install and authenticate:

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init
```

The repository currently uses:
- Android package: `com.shivbora.jarvis`
- iOS bundle identifier: `com.shivbora.jarvis`

Change these before first store submission if you want a different permanent identifier. Store identifiers should be treated as permanent once released.

## Internal test builds

```bash
cd apps/mobile
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

## Production builds

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Submit

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

The first Google Play release may require initial Play Console setup before automated submission. Apple submission requires an Apple Developer account and App Store Connect configuration.

## Required before public release
- production authentication
- privacy policy and support URLs
- app store screenshots / listing copy
- account deletion flow if user accounts are created
- permission disclosures matching actual app behavior
- production database and encrypted connector tokens
- provider terms/compliance review
- crash/error monitoring
- TestFlight / Play internal testing
- security review of payment guard and connector execution
