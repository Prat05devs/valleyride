/**
 * iOS 27 (Xcode 27 SDK) stops apps at launch unless they adopt the UIScene life cycle. Expo ships
 * ExpoAppSceneDelegate for this, but the generated AppDelegate still starts React Native into its own window.
 * This plugin registers the scene delegate in Info.plist and lets it own the window.
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: 'EXExpoAppSceneDelegate' },
        ],
      },
    };
    return c;
  });

  return withAppDelegate(config, (c) => {
    if (c.modResults.language !== 'swift') throw new Error('with-scene-lifecycle expects a Swift AppDelegate');
    let src = c.modResults.contents;
    if (src.includes('ExpoReactNativeFactoryProvider')) return c;
    src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    src = src.replace('  var reactNativeFactory: RCTReactNativeFactory?\n', '  var reactNativeFactory: RCTReactNativeFactory?\n  var reactNativeFactoryModuleName: String { "main" }\n');
    // The scene delegate creates the window and starts React Native into it.
    src = src.replace(/#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/, '');
    if (src.includes('window = UIWindow(frame:')) throw new Error('with-scene-lifecycle: could not remove the AppDelegate window setup');
    c.modResults.contents = src;
    return c;
  });
};
