import { BrowserWindow, app, nativeTheme, systemPreferences } from 'electron'
import chroma from 'chroma-js'
import { stateHasChanged } from '../shared/utils'

const isMac = process.platform == 'darwin'
const isWin = process.platform == 'win32'

/**
 * User changes value in OS (e.g. accent color)
 * Or we manually set value (e.g. dark mode)
 * Could be dark mode, accent color, etc.
 * Native theme updates.
 * 
 * 
 */

/**
 * Setup listeners and get initial values.
 */
export function init() {

  // When user changes theme, update chromium dark mode to match
  global.store.onDidAnyChange((state, oldState) => {
    
    const hasThemeChanged = stateHasChanged(global.patches, "theme")
    if (hasThemeChanged) setChromiumDarkMode(false)
    
    // When user makes changes to View > Dark Mode option, set the 
    // `nativeTheme.themeSource` value on Chromium to match.
    // const darkModeChanged = stateHasChanged(global.patches, "darkMode")
    // if (darkModeChanged) setNativeTheme(false)
  })

  // When nativeTheme changes for any reason, save updated 
  // chromium and system color values to store.
  // Can be triggered by either user app interaction or the OS:
  // 1) App: User changes theme and we set `nativeTheme.themeSource` to match.
  // 2) OS: User turns on OS high contrast accessibility option.
  nativeTheme.on('updated', () => {
    saveChromiumValues()
    saveSystemColors()
  })


  // Set initial Chromium dark mode value, per theme
  setChromiumDarkMode(true)
}


/**
 * When user changes theme, update chromium dark mode to match
 * @param {boolean} isFirstRun 
 */
function setChromiumDarkMode(isFirstRun) {

  nativeTheme.themeSource = global.state().theme.isDark ? 'dark' : 'light'

  if (!isFirstRun) {
    // If dev tools is open, reload (close then open) to force it to load the new theme. Unfortunately it doesn't do so automatically, in either Electron or Chrome.
    const win = BrowserWindow.getFocusedWindow()
    const devToolsIsOpen = !app.isPackaged && win?.webContents?.isDevToolsOpened()
    if (devToolsIsOpen) {
      win.webContents.closeDevTools()
      win.webContents.openDevTools()
    }
  }
}

/**
 * Save Chromium appearance-related values to store.
 */
 function saveChromiumValues() {
  store.dispatch({
    type: 'SAVE_CHROMIUM_VALUES',
    values: {
      themeSource: nativeTheme.themeSource,
      isDarkMode: nativeTheme.shouldUseDarkColors,
      isHighContrast: nativeTheme.shouldUseHighContrastColors,
      isInverted: nativeTheme.shouldUseInvertedColorScheme,
      isReducedMotion: systemPreferences.getAnimationSettings().prefersReducedMotion
    }
  })
}


/**
 * Save system colors to store.
 */
 export async function saveSystemColors() {
  
  const accentColor = chroma(systemPreferences.getAccentColor()).hex()
  let accentColor_h = chroma(accentColor).get("hsl.h").roundToTwo() 
  const accentColor_s = (chroma(accentColor).get("hsl.s") * 100).roundToTwo().toString() + "%"
  const accentColor_l = (chroma(accentColor).get("hsl.l") * 100).roundToTwo().toString() + "%"
  
  // Annoyingly, Chroma sets 0 hue values to NaN.
  // so we have to manually correct them to zero.
  if (!accentColor_h) accentColor_H = 0 

  let systemColors = {
    accentColor,
    accentColor_h,
    accentColor_s,
    accentColor_l,
    ...getSystemColors()
  }


  await global.store.dispatch({ 
    type: 'SAVE_SYSTEM_COLORS', 
    colors: systemColors
  })
}


/**
 * Return macOS system colors.
 * TODO: Dynamically get these once this electron issue is fixed:
 * https://github.com/electron/electron/issues/26628
 * For now we have to hard code these values.
 * NOTE: Commented-out values are unused, so we comment them
 * to keep them from cluttering our CSS variables.
 * @returns Object with system colors
 */
function getSystemColors() {
  
  if (global.state().theme.isDark) {
    return {
      // alternateSelectedControlTextColor: '#FFFFFFFF',
      // findHighlightColor: '#FFFF00FF',
      // highlightColor: '#B4B4B4FF',
      // linkColor: '#419CFFFF',
      // selectedTextColor: '#FFFFFFFF',
      // textBackgroundColor: '#1E1E1EFF',
      // unemphasizedSelectedContentBackgroundColor: '#464646FF',
      // unemphasizedSelectedTextBackgroundColor: '#464646FF',
      // unemphasizedSelectedTextColor: '#FFFFFFFF',
      // windowFrameTextColor: '#FFFFFFD8',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      labelColor: '#FFFFFFD8',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      separatorColor: '#FFFFFF19',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#FFFFFF3F',
      textColor: '#FFFFFFFF',
      windowBackgroundColor: '#323232FF',
    }
  } else {
    return {
      // alternateSelectedControlTextColor: '#FFFFFFFF',
      // findHighlightColor: '#FFFF00FF',
      // highlightColor: '#FFFFFFFF',
      // linkColor: '#0068DAFF',
      // selectedTextColor: '#000000FF',
      // textBackgroundColor: '#FFFFFFFF',
      // unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
      // unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
      // unemphasizedSelectedTextColor: '#000000FF',
      // windowFrameTextColor: '#000000D8',  
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      labelColor: '#000000D8',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      separatorColor: '#00000019',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#00000042',
      textColor: '#000000FF',
      windowBackgroundColor: '#ECECECFF',
    }
  }

}









/**
 * Update `nativeTheme` electron property
 * Setting `nativeTheme.themeSource` has several effects, including: it tells Chrome how to render UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
 * Per: https://www.electronjs.org/docs/api/native-theme
 */
// function setNativeTheme(isFirstRun) {
//   const darkMode = global.state().darkMode
//   switch (darkMode) {
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

//   if (!isFirstRun) {
//     // If dev tools is open, reload (close then open) to force it to load the new theme. Unfortunately it doesn't do so automatically, in either Electron or Chrome.
//     const win = BrowserWindow.getFocusedWindow()
//     const devToolsIsOpen = !app.isPackaged && win?.webContents?.isDevToolsOpened()
//     if (devToolsIsOpen) {
//       win.webContents.closeDevTools()
//       win.webContents.openDevTools()
//     }
//   }
// }






// -------- COLORS -------- //



/**
 * Return an object with list of named colors. 
 * These are turned into CSS variables by the render process.
 * Colors start off taken from the operating system, and (optionally)
 * overrides are applied by the loaded theme.
 * @param {*} observeThemeValues - If true, adhere to theme overrides.
 */
// export function getSystemColorsOld(observeThemeValues = true) {

//   let colors = {}
//   let overriddenVariables = []
//   const state = global.state()

//   // Get initial colors. By default, we match what Chromium's state.
//   // E.g. If Chromium isDarkMode is true, we return dark colors.
//   // Themes can override this with `theme.baseColorScheme` value.
//   // If `observeThemeValues` is true, we use this value.
//   if (!observeThemeValues) {
//     colors = state.chromium.isDarkMode ? getDarkColors() : getLightColors()
//   } else {
//     switch (state.theme.baseColorScheme) {
//       case 'match-app':
//         if (state.chromium.isDarkMode) {
//           colors = getDarkColors()
//         } else {
//           colors = getLightColors()
//         }
//         break
//       case 'dark':
//         colors = getDarkColors()
//         break
//       case 'light':
//         colors = getLightColors()
//         break
//     }
//   }


//   // Apply color overrides. Themes can specify overrides for
//   // individual color variables. `withMode` specifies when they
//   // apply. Always, or only when app is in light or dark mode.
//   if (observeThemeValues) {
//     state.theme.colorOverrides.forEach(({ variable, newValue, withMode }) => {

//       const appliesToCurrentMode =
//         withMode == 'always' ||
//         withMode == 'dark' && state.chromium.isDarkMode ||
//         withMode == 'light' && !state.chromium.isDarkMode

//       if (appliesToCurrentMode) {
//         colors[variable] = newValue
//         overriddenVariables.push(variable)
//         // If overrides sets `controlAccentColor` variable (and only it), 
//         // we need to also generate the darker variation.
//         if (variable == 'controlAccentColor') {
//           colors.darkerControlAccentColor = getDarkerAccentColor(colors.controlAccentColor)
//         }
//       }
//     })
//   }

//   return {
//     colors,
//     overriddenVariables
//   }
// }


// function getDarkColors() {
//   return {

//     // Gambier-specific colors
//     // errorColor: '#FA6E50',

//     // macOS "Dynamic colors":
//     // https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color#dynamic-system-colors
//     ...getAccentColors(true),
//     alternateSelectedControlTextColor: '#FFFFFFFF',
//     controlBackgroundColor: '#1E1E1EFF',
//     controlColor: '#FFFFFF3F',
//     controlTextColor: '#FFFFFFD8',
//     disabledControlTextColor: '#FFFFFF3F',
//     findHighlightColor: '#FFFF00FF',
//     gridColor: '#FFFFFF19',
//     headerTextColor: '#FFFFFFFF',
//     highlightColor: '#B4B4B4FF',
//     labelColor: '#FFFFFFD8',
//     linkColor: '#419CFFFF',
//     placeholderTextColor: '#FFFFFF3F',
//     quaternaryLabelColor: '#FFFFFF19',
//     secondaryLabelColor: '#FFFFFF8C',
//     selectedControlTextColor: '#FFFFFFD8',
//     selectedMenuItemTextColor: '#FFFFFFFF',
//     selectedTextColor: '#FFFFFFFF',
//     separatorColor: '#FFFFFF19',
//     shadowColor: '#000000FF',
//     tertiaryLabelColor: '#FFFFFF3F',
//     textBackgroundColor: '#1E1E1EFF',
//     textColor: '#FFFFFFFF',
//     unemphasizedSelectedContentBackgroundColor: '#464646FF',
//     unemphasizedSelectedTextBackgroundColor: '#464646FF',
//     unemphasizedSelectedTextColor: '#FFFFFFFF',
//     windowBackgroundColor: '#323232FF',
//     windowFrameTextColor: '#FFFFFFD8',

//   }
// }

// function getLightColors() {
//   return {

//     // Gambier-specific colors
//     // errorColor: '#FA6E50',

//     // macOS "Dynamic colors":
//     // https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color#dynamic-system-colors
//     ...getAccentColors(false),
//     alternateSelectedControlTextColor: '#FFFFFFFF',
//     controlBackgroundColor: '#FFFFFFFF',
//     controlColor: '#FFFFFFFF',
//     controlTextColor: '#000000D8',
//     disabledControlTextColor: '#0000003F',
//     findHighlightColor: '#FFFF00FF',
//     gridColor: '#E6E6E6FF',
//     headerTextColor: '#000000D8',
//     highlightColor: '#FFFFFFFF',
//     labelColor: '#000000D8',
//     linkColor: '#0068DAFF',
//     placeholderTextColor: '#0000003F',
//     quaternaryLabelColor: '#00000019',
//     secondaryLabelColor: '#0000007F',
//     selectedControlTextColor: '#000000D8',
//     selectedMenuItemTextColor: '#FFFFFFFF',
//     selectedTextColor: '#000000FF',
//     separatorColor: '#00000019',
//     shadowColor: '#000000FF',
//     tertiaryLabelColor: '#00000042',
//     textBackgroundColor: '#FFFFFFFF',
//     textColor: '#000000FF',
//     unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
//     unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
//     unemphasizedSelectedTextColor: '#000000FF',
//     windowBackgroundColor: '#ECECECFF',
//     windowFrameTextColor: '#000000D8',
//   }
// }

// /**
//  * TEMPORARY: Electron returns incorrect values for controlAccentColor. So we have to hard-code the correct values. Filed issue here: https://github.com/electron/electron/issues/27048
//  */
// function getAccentColors(isDarkMode) {

//   const allegedAccentColor = `#${systemPreferences.getAccentColor().toUpperCase()}`

//   // console.log(systemPreferences.getAccentColor())
//   // console.log(systemPreferences.getColor('keyboard-focus-indicator')) // keyboardFocusIndicatorColor
//   // console.log(systemPreferences.getColor('selected-content-background')) // selectedContentBackgroundColor
//   // console.log(systemPreferences.getColor('selected-control')) // selectedControlColor
//   // console.log(systemPreferences.getColor('text-selected-background')) // selectedTextBackgroundColor

//   switch (allegedAccentColor) {

//     // ------------ BLUE ------------ //
//     case '#0A5FFFFF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#007AFFFF',
//           controlAccentColor: '#007AFFFF',
//           darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
//           keyboardFocusIndicatorColor: '#1AA9FF4C',
//           selectedContentBackgroundColor: '#0058D0FF',
//           selectedControlColor: '#3F638BFF',
//           selectedTextBackgroundColor: '#3F638BFF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#007AFFFF',
//           controlAccentColor: '#007AFFFF',
//           darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
//           keyboardFocusIndicatorColor: '#0067F43F',
//           selectedContentBackgroundColor: '#0063E1FF',
//           selectedControlColor: '#B3D7FFFF',
//           selectedTextBackgroundColor: '#B3D7FFFF',
//         }
//       }

//     // ------------ PURPLE ------------ //
//     case '#923796FF': // Dark
//       return {
//         iconAccentColor: '#A550A7FF',
//         controlAccentColor: '#A550A7FF',
//         darkerControlAccentColor: getDarkerAccentColor('#A550A7FF'),
//         keyboardFocusIndicatorColor: '#DB78DE4C',
//         selectedContentBackgroundColor: '#7F3280FF',
//         selectedControlColor: '#705670FF',
//         selectedTextBackgroundColor: '#705670FF',
//       }
//     case '#812684FF': // Light
//       return {
//         iconAccentColor: '#953D96FF',
//         controlAccentColor: '#953D96FF',
//         darkerControlAccentColor: getDarkerAccentColor('#953D96FF'),
//         keyboardFocusIndicatorColor: '#8326843F',
//         selectedContentBackgroundColor: '#7D2A7EFF',
//         selectedControlColor: '#DFC5DFFF',
//         selectedTextBackgroundColor: '#DFC5DFFF',
//       }

//     // ------------ PINK ------------ //
//     case '#F2318DFF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#F74F9EFF',
//           controlAccentColor: '#F74F9EFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
//           keyboardFocusIndicatorColor: '#FF76D34C',
//           selectedContentBackgroundColor: '#C83179FF',
//           selectedControlColor: '#88566EFF',
//           selectedTextBackgroundColor: '#88566EFF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#F74F9EFF',
//           controlAccentColor: '#F74F9EFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
//           keyboardFocusIndicatorColor: '#EB398D3F',
//           selectedContentBackgroundColor: '#D93B85FF',
//           selectedControlColor: '#FCCAE2FF',
//           selectedTextBackgroundColor: '#FCCAE2FF',
//         }
//       }

//     // ------------ RED ------------ //
//     case '#FC3845FF': // Dark
//       return {
//         iconAccentColor: '#FF5257FF',
//         controlAccentColor: '#FF5257FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FF5257FF'),
//         keyboardFocusIndicatorColor: '#FF7A804C',
//         selectedContentBackgroundColor: '#D03439FF',
//         selectedControlColor: '#8B5758FF',
//         selectedTextBackgroundColor: '#8B5758FF',
//       }
//     case '#D62130FF': // Light
//       return {
//         iconAccentColor: '#E0383EFF',
//         controlAccentColor: '#E0383EFF',
//         darkerControlAccentColor: getDarkerAccentColor('#E0383EFF'),
//         keyboardFocusIndicatorColor: '#D320273F',
//         selectedContentBackgroundColor: '#C3252BFF',
//         selectedControlColor: '#F5C3C5FF',
//         selectedTextBackgroundColor: '#F5C3C5FF',
//       }


//     // ------------ ORANGE ------------ //
//     case '#F36D16FF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#F7821BFF',
//           controlAccentColor: '#F7821BFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
//           keyboardFocusIndicatorColor: '#FFB2394C',
//           selectedContentBackgroundColor: '#C86003FF',
//           selectedControlColor: '#886547FF',
//           selectedTextBackgroundColor: '#886547FF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#F7821BFF',
//           controlAccentColor: '#F7821BFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
//           keyboardFocusIndicatorColor: '#EB6F023F',
//           selectedContentBackgroundColor: '#D96B0AFF',
//           selectedControlColor: '#FCD9BBFF',
//           selectedTextBackgroundColor: '#FCD9BBFF',
//         }
//       }

//     // ------------ YELLOW ------------ //
//     case '#FEBC09FF': // Dark
//       return {
//         iconAccentColor: '#FFC600FF',
//         controlAccentColor: '#FFC600FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FFC600FF'),
//         keyboardFocusIndicatorColor: '#FFFF1A4C',
//         selectedContentBackgroundColor: '#D09C00FF',
//         selectedControlColor: '#8B7A3FFF',
//         selectedTextBackgroundColor: '#8B7A3FFF',
//       }
//     case '#FEBD1EFF': // Light
//       return {
//         iconAccentColor: '#FFC726FF',
//         controlAccentColor: '#FFC726FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FFC726FF'),
//         keyboardFocusIndicatorColor: '#F4B80D3F',
//         selectedContentBackgroundColor: '#E1AC14FF',
//         selectedControlColor: '#FFEEBEFF',
//         selectedTextBackgroundColor: '#FFEEBEFF',
//       }

//     // ------------ GREEN ------------ //
//     case '#53B036FF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#62BA46FF',
//           controlAccentColor: '#62BA46FF',
//           darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
//           keyboardFocusIndicatorColor: '#8DF46C4C',
//           selectedContentBackgroundColor: '#42912AFF',
//           selectedControlColor: '#5C7653FF',
//           selectedTextBackgroundColor: '#5C7653FF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#62BA46FF',
//           controlAccentColor: '#62BA46FF',
//           darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
//           keyboardFocusIndicatorColor: '#4DAB2F3F',
//           selectedContentBackgroundColor: '#4DA032FF',
//           selectedControlColor: '#D0EAC7FF',
//           selectedTextBackgroundColor: '#D0EAC7FF',
//         }
//       }

//     // ------------ GRAPHITE ------------ //
//     case '#797979FF': // Dark
//       return {
//         iconAccentColor: '#8C8C8CFF',
//         controlAccentColor: '#8C8C8CFF',
//         darkerControlAccentColor: getDarkerAccentColor('#8C8C8CFF'),
//         keyboardFocusIndicatorColor: '#C3C3C37F',
//         selectedContentBackgroundColor: '#686868FF',
//         selectedControlColor: '#FFFFFF3F',
//         selectedTextBackgroundColor: '#FFFFFF3F',
//       }
//     case '#868686FF': // Light
//       return {
//         iconAccentColor: '#989898FF',
//         controlAccentColor: '#989898FF',
//         darkerControlAccentColor: getDarkerAccentColor('#989898FF'),
//         controlAccentColor: '#989898FF',
//         keyboardFocusIndicatorColor: '#99999EFF',
//         selectedContentBackgroundColor: '#808080FF',
//         selectedControlColor: '#E0E0E0FF',
//         selectedTextBackgroundColor: '#E0E0E0FF',
//       }
//   }
// }
