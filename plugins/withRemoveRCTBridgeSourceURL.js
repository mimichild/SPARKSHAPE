const { withAppDelegate } = require('@expo/config-plugins');

// Expo SDK 54 的預設 AppDelegate.swift 樣板裡，ReactNativeDelegate 同時
// override 了 sourceURL(for bridge: RCTBridge) 和 bundleURL()。在目前這套
// Xcode 26.6 + expo-camera/expo-media-library 的組合下，Swift 端解析不到
// RCTBridge 這個型別（上游相容性問題），導致編譯失敗：
//   error: cannot find type 'RCTBridge' in scope
// bundleURL() 本身已經足夠提供開發模式的 bundle URL，所以直接把
// sourceURL(for bridge:) 這個 override 整段拿掉即可，不影響本機開發流程。
const SOURCE_URL_OVERRIDE_PATTERN =
  /[ \t]*override func sourceURL\(for bridge: RCTBridge\) -> URL\? \{\n(?:.*\n)*?[ \t]*\}\n\n/;

function withRemoveRCTBridgeSourceURL(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(
        `withRemoveRCTBridgeSourceURL: 預期 AppDelegate.swift（Swift），但拿到 language="${config.modResults.language}"，可能是 Expo 樣板改了，請重新檢查 plugins/withRemoveRCTBridgeSourceURL.js`
      );
    }

    const { contents } = config.modResults;

    if (!SOURCE_URL_OVERRIDE_PATTERN.test(contents)) {
      // 已經被移除過（例如重跑 prebuild 但沒有 --clean），視為成功、不重複處理。
      return config;
    }

    config.modResults.contents = contents.replace(SOURCE_URL_OVERRIDE_PATTERN, '');
    return config;
  });
}

module.exports = withRemoveRCTBridgeSourceURL;
