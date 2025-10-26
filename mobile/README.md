# InfyFit Mobile (React Native)

This directory contains the cross-platform React Native client for InfyFit. The app mirrors the agent flows described in `../AGENTS.md`, providing:

- Instant meal scanning using the device camera with a refinement callback to the FastAPI backend.
- Barcode/label scanning with product lookup, nutrition scoring, and healthier alternatives.
- Workout planning tied to daily goals, completion logging, and offline queueing.
- Coach insights with local notifications to reinforce streaks.
- Privacy controls for health data consent, image retention, and manual export/delete entry points.

## Prerequisites

1. [Node.js 18+](https://nodejs.org/) and `npm` or `yarn`.
2. [Expo CLI](https://docs.expo.dev/more/expo-cli/) (installed automatically via `npx expo`).
3. Xcode (for iOS simulators/devices) or Android Studio (for Android emulators/devices).
4. The InfyFit FastAPI backend running locally (see the repo root README).

## Getting started

```bash
cd mobile
npm install
npm run start
```

The Metro bundler opens in your browser. From there you can:

- Press **i** to launch the iOS simulator, or run `npm run ios` for a device build.
- Press **a** to launch the Android emulator, or run `npm run android`.
- Scan the QR code with the Expo Go app for on-device testing.

Set the API base URL using Expo extras so the client can reach your backend:

```bash
EXPO_API_BASE_URL="https://your-ngrok-or-host" npx expo start
```

(Expo injects this into `Constants.manifest.extra.apiBaseUrl`, which the app reads via `API_BASE_URL`.)

## Testing & linting

```bash
npm run typecheck
npm run lint
npm test
```

Jest and React Testing Library are preconfigured via `jest-expo`. Add tests under `mobile/src/__tests__` to cover UI and data flows.

## Native builds

- **iOS**: `npm run ios` performs a local build via Xcode. Configure signing in Xcode’s workspace generated under `ios/` after running `npx expo run:ios` once.
- **Android**: `npm run android` builds a debug APK. For release builds, follow Expo’s [EAS Build](https://docs.expo.dev/build/introduction/) docs or generate a local Gradle build after running `npx expo run:android`.

## Folder structure

```
mobile/
├── App.tsx                  # Providers + navigation shell
├── app.json                 # Expo app configuration and permissions
├── src/
│   ├── context/             # Preferences and offline queue providers
│   ├── hooks/               # Camera + notifications helpers
│   ├── navigation/          # React Navigation setup
│   ├── screens/             # Feature screens (meals, products, workouts, coach, settings, offline)
│   ├── services/            # HTTP client + typed API bindings
│   ├── theme/               # Palette, spacing, typography tokens
│   └── utils/               # Constants and helpers
└── (add assets/)            # Provide your own icons/splash if desired
```

## Accessibility & guardrails

- Colour palette and typography respect WCAG 2.2 AA contrast targets.
- Camera flows expose permission-state messaging and alternate input paths.
- Offline queue allows manual control over retries in compliance with MASVS privacy guardrails.
- Push notifications respect quiet hours by scheduling local reminders 2 hours out when the daily coach card updates.

Add platform-specific icons and splash screens by creating an `assets/` directory and updating `app.json` when you are ready to ship a branded build.
