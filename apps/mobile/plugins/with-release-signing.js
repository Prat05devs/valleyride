/**
 * Signs local Android release builds (AAB and APK) with the Play upload key. The key and its passwords stay out of
 * the repo: set VALLEYRIDE_UPLOAD_STORE_FILE, _KEY_ALIAS, _STORE_PASSWORD and _KEY_PASSWORD in
 * ~/.gradle/gradle.properties. Without them, release builds keep the debug key (fine for local testing only).
 * EAS builds inject their own signing config and are unaffected.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE = `
        release {
            if (project.hasProperty('VALLEYRIDE_UPLOAD_STORE_FILE')) {
                storeFile file(VALLEYRIDE_UPLOAD_STORE_FILE)
                storePassword VALLEYRIDE_UPLOAD_STORE_PASSWORD
                keyAlias VALLEYRIDE_UPLOAD_KEY_ALIAS
                keyPassword VALLEYRIDE_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let g = c.modResults.contents;
    if (g.includes('VALLEYRIDE_UPLOAD_STORE_FILE')) return c;
    // Add the release config after the debug one, then point the release build type at it when the key is present.
    g = g.replace(/(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/, `$1${RELEASE}`);
    g = g.replace(/(release\s*\{\s*(?:\/\/[^\n]*\n\s*)*)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('VALLEYRIDE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug");
    if (!g.includes('? signingConfigs.release')) throw new Error('with-release-signing: build.gradle layout changed; update the plugin');
    c.modResults.contents = g;
    return c;
  });
};
