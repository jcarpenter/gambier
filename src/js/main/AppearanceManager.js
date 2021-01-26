import { BrowserWindow, webContents, app, nativeTheme, systemPreferences } from 'electron'
import chroma from 'chroma-js'
import { stateHasChanged } from '../shared/utils'



export function init() {

  // When nativeTheme changes for any reason, get updated colors.
  // 'updated' fires when something tells Chromium to update visual settings.
  // Can be triggered by app logic, or from the OS:
  // 1) By app: App manually sets `nativeTheme.themeSource` to 'dark'.
  // 2) By OS: Dark mode activates at 10pm. Chromium gets notification 
  //    from OS that OS appearance has changed, and `nativeTheme.themeSource` 
  //    is 'system', so Chromium accepts the change.
  nativeTheme.on('updated', () => {
    saveChromiumValues()
    sendUpdatedColorsToRenderProcess()
  })

  // When `theme.app` changes, update Chrome nativeTheme.themeSource.
  global.store.onDidAnyChange((state, oldState) => {
    const appThemeChanged = stateHasChanged(global.patches, ["theme", "app"])
    if (appThemeChanged) {
      setNativeTheme(false)
    }
  })

  // Set native UI to theme value in store
  setNativeTheme(true)
}

/**
 * Update `nativeTheme` electron property
 * Setting `nativeTheme.themeSource` has several effects, including: it tells Chrome how to render UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
 * Per: https://www.electronjs.org/docs/api/native-theme
 */
function setNativeTheme(isFirstRun) {
  const appTheme = global.state().theme.app
  switch (appTheme) {
    case 'match-system':
      nativeTheme.themeSource = 'system'
      break
    case 'light':
      nativeTheme.themeSource = 'light'
      break
    case 'dark':
      nativeTheme.themeSource = 'dark'
      break
  }

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
 * Save Chromium appearance-related values to store. Note: nativeTheme properties  will usually match the OS, because they're usually set by the OS. But in some cases, they will differ. If the user chooses `View > Appearance > Light` while the OS is in dark mode, for example. 
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
 * When nativeTheme changes, we assume system colors have changed, 
 * get the new values, and send them to render process. Which then
 * applies them as css variables.
*/
function sendUpdatedColorsToRenderProcess() {
  webContents.getAllWebContents().forEach((contents) => {
    contents.send('updatedSystemColors', getSystemColors())
  })
}











// -------- COLORS -------- //

export function getSystemColors() {

  const isDarkMode = nativeTheme.shouldUseDarkColors

  if (isDarkMode) {
    return {
      // System colors
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
      // Accent-influenced dynamic colors
      ...getAccentColors(isDarkMode),
      // All other dynamic dystem colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      highlightColor: '#B4B4B4FF',
      labelColor: '#FFFFFFD8',
      linkColor: '#419CFFFF',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
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
    }
  } else {
    return {
      //System colors
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
      // Accent-influenced dynamic colors
      ...getAccentColors(isDarkMode),
      // All other dynamic dystem colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      highlightColor: '#FFFFFFFF',
      labelColor: '#000000D8',
      linkColor: '#0068DAFF',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
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
    }
  }
}

/**
 * TEMPORARY: Electron returns incorrect values for controlAccentColor. So we have to hard-code the correct values. Filed issue here: https://github.com/electron/electron/issues/27048
 */
function getAccentColors(isDarkMode) {

  const allegedAccentColor = `#${systemPreferences.getAccentColor().toUpperCase()}`

  switch (allegedAccentColor) {

    // ------------ BLUE ------------ //
    case '#0A5FFFFF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#007AFFFF',
          darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
          keyboardFocusIndicatorColor: '#1AA9FF4C',
          selectedContentBackgroundColor: '#0058D0FF',
          selectedControlColor: '#3F638BFF',
          selectedTextBackgroundColor: '#3F638BFF',
        }
      } else {
        return {
          controlAccentColor: '#007AFFFF',
          darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
          keyboardFocusIndicatorColor: '#0067F43F',
          selectedContentBackgroundColor: '#0063E1FF',
          selectedControlColor: '#B3D7FFFF',
          selectedTextBackgroundColor: '#B3D7FFFF',
        }
      }

    // ------------ PURPLE ------------ //
    case '#923796FF': // Dark
      return {
        controlAccentColor: '#A550A7FF',
        darkerControlAccentColor: getDarkerAccentColor('#A550A7FF'),
        keyboardFocusIndicatorColor: '#DB78DE4C',
        selectedContentBackgroundColor: '#7F3280FF',
        selectedControlColor: '#705670FF',
        selectedTextBackgroundColor: '#705670FF',
      }
    case '#812684FF': // Light
      return {
        controlAccentColor: '#953D96FF',
        darkerControlAccentColor: getDarkerAccentColor('#953D96FF'),
        keyboardFocusIndicatorColor: '#8326843F',
        selectedContentBackgroundColor: '#7D2A7EFF',
        selectedControlColor: '#DFC5DFFF',
        selectedTextBackgroundColor: '#DFC5DFFF',
      }

    // ------------ PINK ------------ //
    case '#F2318DFF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#F74F9EFF',
          darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
          keyboardFocusIndicatorColor: '#FF76D34C',
          selectedContentBackgroundColor: '#C83179FF',
          selectedControlColor: '#88566EFF',
          selectedTextBackgroundColor: '#88566EFF',
        }
      } else {
        return {
          controlAccentColor: '#F74F9EFF',
          darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
          keyboardFocusIndicatorColor: '#EB398D3F',
          selectedContentBackgroundColor: '#D93B85FF',
          selectedControlColor: '#FCCAE2FF',
          selectedTextBackgroundColor: '#FCCAE2FF',
        }
      }

    // ------------ RED ------------ //
    case '#FC3845FF': // Dark
      return {
        controlAccentColor: '#FF5257FF',
        darkerControlAccentColor: getDarkerAccentColor('#FF5257FF'),
        keyboardFocusIndicatorColor: '#FF7A804C',
        selectedContentBackgroundColor: '#D03439FF',
        selectedControlColor: '#8B5758FF',
        selectedTextBackgroundColor: '#8B5758FF',
      }
    case '#D62130FF': // Light
      return {
        controlAccentColor: '#E0383EFF',
        darkerControlAccentColor: getDarkerAccentColor('#E0383EFF'),
        keyboardFocusIndicatorColor: '#D320273F',
        selectedContentBackgroundColor: '#C3252BFF',
        selectedControlColor: '#F5C3C5FF',
        selectedTextBackgroundColor: '#F5C3C5FF',
      }


    // ------------ ORANGE ------------ //
    case '#F36D16FF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#F7821BFF',
          darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
          keyboardFocusIndicatorColor: '#FFB2394C',
          selectedContentBackgroundColor: '#C86003FF',
          selectedControlColor: '#886547FF',
          selectedTextBackgroundColor: '#886547FF',
        }
      } else {
        return {
          controlAccentColor: '#F7821BFF',
          darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
          keyboardFocusIndicatorColor: '#EB6F023F',
          selectedContentBackgroundColor: '#D96B0AFF',
          selectedControlColor: '#FCD9BBFF',
          selectedTextBackgroundColor: '#FCD9BBFF',
        }
      }

    // ------------ YELLOW ------------ //
    case '#FEBC09FF': // Dark
      return {
        controlAccentColor: '#FFC600FF',
        darkerControlAccentColor: getDarkerAccentColor('#FFC600FF'),
        keyboardFocusIndicatorColor: '#FFFF1A4C',
        selectedContentBackgroundColor: '#D09C00FF',
        selectedControlColor: '#8B7A3FFF',
        selectedTextBackgroundColor: '#8B7A3FFF',
      }
    case '#FEBD1EFF': // Light
      return {
        controlAccentColor: '#FFC726FF',
        darkerControlAccentColor: getDarkerAccentColor('#FFC726FF'),
        keyboardFocusIndicatorColor: '#F4B80D3F',
        selectedContentBackgroundColor: '#E1AC14FF',
        selectedControlColor: '#FFEEBEFF',
        selectedTextBackgroundColor: '#FFEEBEFF',
      }

    // ------------ GREEN ------------ //
    case '#53B036FF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#62BA46FF',
          darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
          keyboardFocusIndicatorColor: '#8DF46C4C',
          selectedContentBackgroundColor: '#42912AFF',
          selectedControlColor: '#5C7653FF',
          selectedTextBackgroundColor: '#5C7653FF',
        }
      } else {
        return {
          controlAccentColor: '#62BA46FF',
          darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
          keyboardFocusIndicatorColor: '#4DAB2F3F',
          selectedContentBackgroundColor: '#4DA032FF',
          selectedControlColor: '#D0EAC7FF',
          selectedTextBackgroundColor: '#D0EAC7FF',
        }
      }

    // ------------ GRAPHITE ------------ //
    case '#797979FF': // Dark
      return {
        controlAccentColor: '#8C8C8CFF',
        darkerControlAccentColor: getDarkerAccentColor('#8C8C8CFF'),
        keyboardFocusIndicatorColor: '#C3C3C37F',
        selectedContentBackgroundColor: '#686868FF',
        selectedControlColor: '#FFFFFF3F',
        selectedTextBackgroundColor: '#FFFFFF3F',
      }
    case '#868686FF': // Light
      return {
        controlAccentColor: '#989898FF',
        darkerControlAccentColor: getDarkerAccentColor('#989898FF'),
        controlAccentColor: '#989898FF',
        keyboardFocusIndicatorColor: '#99999EFF',
        selectedContentBackgroundColor: '#808080FF',
        selectedControlColor: '#E0E0E0FF',
        selectedTextBackgroundColor: '#E0E0E0FF',
      }
  }
}


function getDarkerAccentColor(accentColor) {
  return chroma.blend(accentColor, '#EEEEEE', 'burn').desaturate(0).hex();
}

function rgbaHexToRgbaCSS(hex, alphaOveride, brightnessAdjustment = 0) {
  const r = parseInt(hex.slice(1, 3), 16) + brightnessAdjustment
  const g = parseInt(hex.slice(3, 5), 16) + brightnessAdjustment
  const b = parseInt(hex.slice(5, 7), 16) + brightnessAdjustment
  const a = alphaOveride ? alphaOveride : parseInt(hex.slice(8, 9), 16)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

