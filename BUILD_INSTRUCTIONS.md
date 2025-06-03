# Build Instructions for Noted - Smart Notes App

If you've been experiencing build errors, follow these steps to resolve them:

## 1. Clean the Project

First, clean all build artifacts to ensure a fresh build:

```bash
# Clean the build cache
npm run clean

# Clean the Android project
npm run clean:android
```

## 2. Font Issues

The app requires the GoogleSans-Regular.ttf font to be present in the `assets/fonts` directory. Make sure it exists and is not corrupted:

```bash
# Check if the font file exists and has content
dir assets\fonts
```

If the font file is missing or has 0 bytes, copy a substitute font:

```bash
# On Windows
copy C:\Windows\Fonts\Arial.ttf assets\fonts\GoogleSans-Regular.ttf

# On Mac/Linux
# cp /System/Library/Fonts/Helvetica.ttc assets/fonts/GoogleSans-Regular.ttf
```

## 3. Kotlin Version Fix

We've updated the Kotlin version to 1.9.24 in multiple locations:
- android/build.gradle
- android/gradle.properties
- app.json (via expo-build-properties)
- android/gradle/libs.versions.toml (Version catalog)
- android/gradle/gradle-versions.toml (Additional Version catalog)
- android/catalog-versions.gradle (Explicit mapping)
- android/settings.gradle (Plugin management)

This comprehensive approach ensures the Kotlin version is available to all components of the build system, fixing the "Key 1.9.24 is missing in the map" error.

## 4. Rebuilding the Project

After cleaning and fixing the font issues, rebuild the project:

```bash
# Rebuild with clean prebuild
npm run prebuild:clean

# Then build for Android
npm run android
```

## 5. Deploying with Expo

When deploying with Expo, use:

```bash
npx expo prebuild --clean
npx expo build:android
```

If you continue to experience issues, try running with verbose logging:

```bash
npx expo build:android --verbose
```

## Common Errors and Solutions

1. **"Key 1.9.24 is missing in the map"**
   - Fixed by explicitly adding Kotlin version in multiple Gradle configuration files
   - Added version catalogs and explicit mappings to ensure consistency

2. **Font-related errors**
   - Fixed by ensuring valid font files are in assets/fonts
   - Updated the sourceSets in android/app/build.gradle

3. **Android SDK version mismatches**
   - Fixed by adding explicit SDK versions in build.gradle
   - Added expo-build-properties plugin with correct Android configurations

## Additional Troubleshooting

If you still encounter issues, check that the version catalogs are correctly loaded:

```bash
cd android
./gradlew :help --scan
```

This will output information about the build, including loaded catalogs and version information.

If you encounter any new errors, please provide the full error log for further assistance. 