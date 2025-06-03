# Deployment Instructions for Noted - Smart Notes App

This guide provides detailed steps to resolve the Kotlin version compatibility issues when deploying your app with Expo.

## Understanding the Error

The error `Key 1.9.24 is missing in the map` occurs because the Expo build system expects the Kotlin version (1.9.24) to be defined in a specific way, but it's not finding it in the expected format or location.

## Complete Fix Implementation

We've implemented multiple strategies to fix this issue:

1. **Direct Kotlin version injection** via expo-kotlin-fix.gradle
2. **Multiple definition points** in various Gradle configuration files
3. **Version catalog support** through catalog-versions.gradle
4. **React Native Gradle Plugin patching** script

## Deployment Steps

Follow these steps in order:

### 1. Patch the React Native Gradle Plugin

```bash
# Run the patch script to update the Kotlin version in the RN Gradle Plugin
npm run patch:kotlin
```

### 2. Clean the Project

```bash
# Clean all build artifacts
npm run clean

# Clean the Android project specifically
npm run clean:android
```

### 3. Verify Font Files

```bash
# Check that the font file exists and has content
dir assets\fonts
```

If the GoogleSans-Regular.ttf file is missing or empty, copy a substitute:

```bash
# On Windows
copy C:\Windows\Fonts\Arial.ttf assets\fonts\GoogleSans-Regular.ttf

# On Mac/Linux
# cp /System/Library/Fonts/Helvetica.ttc assets/fonts/GoogleSans-Regular.ttf
```

### 4. Build with All Fixes Applied

Use our special build script that combines all fixes:

```bash
# Run the patched build process
npm run build:patched
```

This script will:
1. Patch the React Native Gradle Plugin
2. Clean the Expo prebuild
3. Rebuild with the patched configuration

## Manual Build Process

If you prefer to execute the steps manually:

```bash
# 1. Patch the React Native Gradle Plugin
node android/patch-rn-gradle-plugin.js

# 2. Clean the Expo prebuild
npx expo prebuild --clean

# 3. Build for Android
npx expo build:android
```

## Troubleshooting

If you still encounter the Kotlin version error:

1. **Check the Expo EAS log** for specific error locations

2. **Verify all Kotlin version references** are consistent:
   - android/build.gradle
   - android/gradle.properties
   - android/local.properties
   - android/settings.gradle
   - android/catalog-versions.gradle
   - android/expo-kotlin-fix.gradle

3. **Try with verbose logging**:
   ```bash
   npx expo build:android --verbose
   ```

4. **Inspect the Gradle configuration**:
   ```bash
   cd android
   ./gradlew properties | grep -i kotlin
   ```

5. **EAS Build with specific profile**:
   ```bash
   eas build --profile development --platform android
   ```

## Additional Resources

- [React Native Gradle Plugin Issues](https://github.com/facebook/react-native/issues?q=is%3Aissue+kotlin+version)
- [Expo Docs on Android Builds](https://docs.expo.dev/build/setup/)
- [Kotlin Version Compatibility Matrix](https://kotlinlang.org/docs/gradle.html#gradle-kotlin-dsl) 