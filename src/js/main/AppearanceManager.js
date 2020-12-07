import { nativeTheme, systemPreferences } from 'electron'

export class AppearanceManager {
  constructor() {

    // Listen for system appearance changes (e.g. when user sets Dark mode in System Preferences). The `nativTheme` API emits 'updated' event: "...when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."

    nativeTheme.on('updated', systemAppearanceChanged)


  }

  startup() {
    systemAppearanceChanged()
  }

}

/**
 * When system appearance changes, save values to state.
 */
function systemAppearanceChanged() {

  const isDarkMode = nativeTheme.shouldUseDarkColors
  const isHighContrast = nativeTheme.shouldUseHighContrastColors
  const isInverted = nativeTheme.shouldUseInvertedColorScheme

  store.dispatch({
    type: 'SAVE_SYSTEM_APPEARANCE_SETTINGS',
    settings: {
      themeSource: nativeTheme.themeSource,
      isDarkMode: isDarkMode,
      isHighContrast: isHighContrast,
      isInverted: isInverted,
      isReducedMotion: systemPreferences.getAnimationSettings().prefersReducedMotion,
      colors: isDarkMode ? getColors(true) : getColors(false)
    }
  })

  // const userPref = store.store.appearance.userPref
  // console.log("main.js: nativeTheme updated")
  // if (userPref == 'match-system') {
  //   store.dispatch({
  //     type: 'SET_APPEARANCE',
  //     theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
  //   })
  // }
}

function getColors(isDarkMode, isHighContrast, isInverted) {

  if (isDarkMode) {
    return {
      // System Colors
      systemBlue: '#0A84FFFF',
      systemBrown: '#AC8E68FF',
      systemGray: '#98989DFF',
      systemGreen: '#32D74BFF',
      systemIndigo: '#5E5CE6FF',
      systemOrange: '#FF9F0AFF',
      systemPink: '#FF375FFF',
      systemPurple: '#BF5AF2FF',
      systemRed: '#FF453AFF',
      systemTeal: '#64D2FFFF',
      systemYellow: '#FFD60AFF',
      // Dynamic System Colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlAccentColor: '#007AFFFF',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      highlightColor: '#B4B4B4FF',
      keyboardFocusIndicatorColor: '#1AA9FF4C',
      labelColor: '#FFFFFFD8',
      linkColor: '#419CFFFF',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedContentBackgroundColor: '#0058D0FF',
      selectedControlColor: '#3F638BFF',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      selectedTextBackgroundColor: '#3F638BFF',
      selectedTextColor: '#FFFFFFFF',
      separatorColor: '#FFFFFF19',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#FFFFFF3F',
      textBackgroundColor: '#1E1E1EFF',
      textColor: '#FFFFFFFF',
      unemphasizedSelectedContentBackgroundColor: '#464646FF',
      unemphasizedSelectedTextBackgroundColor: '#464646FF',
      unemphasizedSelectedTextColor: '#FFFFFFFF',
      windowBackgroundColor: '#323232FF',
      windowFrameTextColor: '#FFFFFFD8',
      // Gambier-specific colors.
      foregroundColor: '255, 255, 255',
      backgroundColor: '0, 0, 0',
      menuMaterialColor: rgbaHexToRgbaCSS('#1E1E1EFF', 0.1)
    }
  } else {
    return {
      //System Colors
      systemBlue: '#007AFFFF',
      systemBrown: '#A2845EFF',
      systemGray: '#8E8E93FF',
      systemGreen: '#28CD41FF',
      systemIndigo: '#5856D6FF',
      systemOrange: '#FF9500FF',
      systemPink: '#FF2D55FF',
      systemPurple: '#AF52DEFF',
      systemRed: '#FF3B30FF',
      systemTeal: '#55BEF0FF',
      systemYellow: '#FFCC00FF',
      // Dynamic System Colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlAccentColor: '#007AFFFF',
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      highlightColor: '#FFFFFFFF',
      keyboardFocusIndicatorColor: '#0067F43F',
      labelColor: '#000000D8',
      linkColor: '#0068DAFF',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedContentBackgroundColor: '#0063E1FF',
      selectedControlColor: '#B3D7FFFF',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      selectedTextBackgroundColor: '#B3D7FFFF',
      selectedTextColor: '#000000FF',
      separatorColor: '#00000019',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#00000042',
      textBackgroundColor: '#FFFFFFFF',
      textColor: '#000000FF',
      unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
      unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
      unemphasizedSelectedTextColor: '#000000FF',
      windowBackgroundColor: '#ECECECFF',
      windowFrameTextColor: '#000000D8',
      // Gambier-specific colors
      foregroundColor: '0, 0, 0',
      backgroundColor: '255, 255, 255',
      // menuMaterialColor: Used in `material-menu` mixin (which simulates the `menu` macOS material), this is `controlBackgroundColor` with low opacity. 
      menuMaterialColor: rgbaHexToRgbaCSS('#FFFFFFFF', 0.925, -5)
    }
  }
}

function rgbaHexToRgbaCSS(hex, alphaOveride, brightnessAdjustment = 0) {
  const r = parseInt(hex.slice(1, 3), 16) + brightnessAdjustment
  const g = parseInt(hex.slice(3, 5), 16) + brightnessAdjustment
  const b = parseInt(hex.slice(5, 7), 16) + brightnessAdjustment
  const a = alphaOveride ? alphaOveride : parseInt(hex.slice(8, 9), 16)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// // -------- Theme -------- //

/**
 * When OS appearance changes, update app theme to match (dark or light):
 * NOTE: Is also called on startup.
 * Listen for changes to nativeTheme. These are triggered when the OS appearance changes (e.g. when the user modifies "Appearance" in System Preferences > General, on Mac). If the user has selected the "Match System" appearance option in the app, we need to match the new OS appearance. Check the `nativeTheme.shouldUseDarkColors` value, and set the theme accordingly (dark or light).
 * nativeTheme.on('updated'): "Emitted when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."
 */


/**
 * When user modifies "Appearance" setting (e.g in `View` menu), update `nativeTheme`
 */
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