const { withPodfile } = require('@expo/config-plugins');

// fmt 11.x 的 consteval 編譯期字串檢查在新版 Clang（Xcode 26.6）下會直接編譯
// 失敗（"call to consteval function ... is not a constant expression"）。fmt
// 內部用 FMT_CPLUSPLUS < 201709L 判斷要不要啟用 consteval，直接
// -D FMT_CONSTEVAL= 沒用（標頭檔會無條件重新 #define 蓋掉），所以把 fmt 這個
// target 的語言標準降回 C++17，讓它自己判斷關掉 consteval。等 React Native
// 上游更新相依版本後可移除。
const FMT_FIX_SNIPPET = `
    # fmt 11.x 的 consteval 編譯期字串檢查在新版 Clang（Xcode 26.6）下會直接編譯失敗
    # （"call to consteval function ... is not a constant expression"）。fmt 內部用
    # FMT_CPLUSPLUS < 201709L 判斷要不要啟用 consteval，直接 -D FMT_CONSTEVAL= 沒用
    # （標頭檔會無條件重新 #define 蓋掉），所以改成把 fmt 這個 target 的語言標準降回
    # C++17，讓它自己判斷關掉 consteval。等 React Native 上游更新相依版本後可移除。
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'
      end
    end
`;

function withFmtConstevalFix(config) {
  return withPodfile(config, (config) => {
    const { contents } = config.modResults;

    if (contents.includes("target.name == 'fmt'")) {
      // 已經被加過（例如重跑 prebuild 但沒有 --clean），視為成功、不重複處理。
      return config;
    }

    // 一定要接在 react_native_post_install(...) 呼叫「之後」，不能插在它前面：
    // react_native_post_install 自己會設定各 pod target 的 C++ 語言標準，插在
    // 它前面的話，我們的 gnu++17 設定會被它蓋掉，導致 fmt 還是編譯失敗。
    const reactNativePostInstallMatch = contents.match(
      /(react_native_post_install\(\n(?:.*\n)*?    \)\n)/
    );
    if (!reactNativePostInstallMatch) {
      throw new Error(
        'withFmtConstevalFix: 在 Podfile 裡找不到 react_native_post_install(...) 呼叫，可能是 Expo 樣板改了，請重新檢查 plugins/withFmtConstevalFix.js'
      );
    }

    config.modResults.contents = contents.replace(
      reactNativePostInstallMatch[1],
      `${reactNativePostInstallMatch[1]}${FMT_FIX_SNIPPET}`
    );
    return config;
  });
}

module.exports = withFmtConstevalFix;
