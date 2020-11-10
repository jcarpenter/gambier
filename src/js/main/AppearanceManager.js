export class AppearanceManager {
  constructor() {

  }
}

// // -------- Theme -------- //

// /**
//  * When OS appearance changes, update app theme to match (dark or light):
//  * NOTE: Is also called on startup.
//  * Listen for changes to nativeTheme. These are triggered when the OS appearance changes (e.g. when the user modifies "Appearance" in System Preferences > General, on Mac). If the user has selected the "Match System" appearance option in the app, we need to match the new OS appearance. Check the `nativeTheme.shouldUseDarkColors` value, and set the theme accordingly (dark or light).
//  * nativeTheme.on('updated'): "Emitted when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."
//  */
// nativeTheme.on('updated', () => {

//   // console.log("nativeTheme updated:")
//   // console.log(nativeTheme.themeSource)
//   // console.log(nativeTheme.shouldUseDarkColors)
//   // console.log(nativeTheme.shouldUseHighContrastColors)
//   // console.log(nativeTheme.shouldUseInvertedColorScheme)
//   // console.log('selected-text-background = ', systemPreferences.getColor('selected-text-background'))

//   const userPref = store.store.appearance.userPref
//   console.log("main.js: nativeTheme updated")
//   if (userPref == 'match-system') {
//     store.dispatch({
//       type: 'SET_APPEARANCE',
//       theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
//     })
//   }
// })

// /**
//  * When user modifies "Appearance" setting (e.g in `View` menu), update `nativeTheme`
//  */
// store.onDidChange('appearance', () => {
//   setNativeTheme()
// })

// /**
//  * Update `nativeTheme` electron property
//  * Setting `nativeTheme.themeSource` has several effects. E.g. it tells Chrome how to UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
//  * Per: https://www.electronjs.org/docs/api/native-theme
//  */
// export function setNativeTheme() {
//   const userPref = store.store.appearance.userPref
//   switch (userPref) {
//     case 'match-system':
//       nativeTheme.themeSource = 'system'
//       break
//     case 'light':
//       nativeTheme.themeSource = 'light'
//       break
//     case 'dark':
//       nativeTheme.themeSource = 'dark'
//       break
//   }

//   // console.log('setNativeTheme(). nativeTheme.themeSource = ', nativeTheme.themeSource)
//   // console.log('setNativeTheme(). userPref = ', userPref)
//   // console.log('setNativeTheme(). systemPreferences.getAccent   Color() = ', systemPreferences.getAccentColor())
//   // console.log('setNativeTheme(). window-background = ', systemPreferences.getColor('window-background'))
//   // 

//   // Reload (close then open) DevTools to force it to load the new theme. Unfortunately DevTools does not respond to `nativeTheme.themeSource` changes automatically. In Electron, or in Chrome.
//   if (!app.isPackaged && win && win.webContents && win.webContents.isDevToolsOpened()) {
//     win.webContents.closeDevTools()
//     win.webContents.openDevTools()
//   }
// }

// console.log("Hi ------ ")
// console.log(systemPreferences.isDarkMode())
// console.log(systemPreferences.getUserDefault('AppleInterfaceStyle', 'string'))
// console.log(systemPreferences.getUserDefault('AppleAquaColorVariant', 'integer'))
// console.log(systemPreferences.getUserDefault('AppleHighlightColor', 'string'))
// console.log(systemPreferences.getUserDefault('AppleShowScrollBars', 'string'))
// console.log(systemPreferences.getAccentColor())
// console.log(systemPreferences.getSystemColor('blue'))
// console.log(systemPreferences.effectiveAppearance)