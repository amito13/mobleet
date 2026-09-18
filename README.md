# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Google / GitHub sign-in setup

Use a development build for native OAuth testing; Expo Go does not support
the app's custom `mobleet` scheme.

1. In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs,
   add `mobleet://auth/callback` and save. A browser landing on `localhost` after
   sign-in usually means the requested redirect was not allowlisted and the
   project's default Site URL was used. The app logs its redirect URL in development.
2. In the Google OAuth web client's authorized redirect URIs, use the Supabase
   callback URL: `https://chbtdplfrkdcsokmqcme.supabase.co/auth/v1/callback`.
   Enable Google and configure its client ID and secret in Supabase's provider settings.
3. Build Android locally with `npx expo run:android`, or build with
   `npx eas-cli build --profile development --platform android` and install the APK.
4. Run `npx expo start --dev-client`, open the installed Mobleet app, and sign in.
   The native redirect should be `mobleet://auth/callback`.

For web testing, separately allowlist the exact web callback URL logged by the app.
Rebuild the native app whenever its URL scheme changes.

References: [Expo authentication](https://docs.expo.dev/guides/authentication/),
[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
