const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Release APKs for on-device testing talk to the API on the developer's Mac over plain http (LAN IP), which Android
 * blocks in release builds. Set ANDROID_ALLOW_CLEARTEXT=1 at prebuild time to allow it for that test build only.
 * Production builds leave it unset and use https://api.valleyride.in.
 */
module.exports = function withTestCleartext(config) {
  if (process.env.ANDROID_ALLOW_CLEARTEXT !== '1') return config;
  return withAndroidManifest(config, (c) => {
    c.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    return c;
  });
};
