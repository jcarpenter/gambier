import { stateHasChanged } from "../shared/utils"


/**
 * Set initial theme values
 * @param {*} initialColors 
 */
export function init(state) {

  // Listen for system color changes

  // Set stylsheets
  setPlatformStylesheet(state)
  setAppThemeStylesheet(state)
  setEditorThemeStylesheet(state)

  // Set css variables
  setSystemColorCSSVars(state)
  setEditorTypographyCSSVars(state)
  // setMiscellaneousCSSVars(state)
}


/** 
 * Called by StateManager every time state changes (patches) arrive from main.
 * Check what changed and updated css variables for accentColors, etc.
 * @param {*} newState 
 * @param {*} patches 
 */
export async function updateTheme(newState, patches) {

  // Set stylesheets

  if (stateHasChanged(patches, "appTheme")) {
    setAppThemeStylesheet(newState)
  }

  if (stateHasChanged(patches, "editorTheme")) {
    setEditorThemeStylesheet(newState)
  }

  // Set color css variables

  const darkModeChanged = stateHasChanged(patches, "darkMode")
  const appThemeChanged = stateHasChanged(patches, "appTheme")
  const editorThemeChanged = stateHasChanged(patches, "editorTheme")
  const systemColorsChanged = stateHasChanged(patches, "systemColors")

  // If any of the above changed, 
  // TODO 4/15: Make it possible to ignore new values from system?
  // E.g. Re-implement override option... Ugh.
  if (darkModeChanged || appThemeChanged || editorThemeChanged || systemColorsChanged) {
    setSystemColorCSSVars(state)
  }

  // Set typography css variables

  const editorTypographyChanged =
    stateHasChanged(patches, "editorFont") ||
    stateHasChanged(patches, "editorLineHeight") ||
    stateHasChanged(patches, "editorMaxLineWidth")

  if (editorTypographyChanged) {
    setEditorTypographyCSSVars(state)
  }

  // Set other miscellaneous css variables

  // const miscVariablesChanged =
  //   stateHasChanged(patches, "developer")

  // if (miscVariablesChanged) {
  //   setMiscellaneousCSSVars(state)
  // }

}


/**
 * Set system colors as CSS variables on `body`.
 * TODO: Might want to check if there's a mismatch before updating?
 * This shoudn't be called very often, so probably isn't an issue.
 */
 function setSystemColorCSSVars(state) {
  // console.log('setSystemColorsAsCSSVariables')
  for (const [varName, rgbaHex] of Object.entries(state.systemColors)) {
    document.body.style.setProperty(`--${varName}`, rgbaHex)
  }
}

/**
 * Set editor typography values as CSS variables on `body`.
 */
function setEditorTypographyCSSVars(state) {
  document.body.style.setProperty("--editor-fontsize", `${state.editorFont.size}px`)
  document.body.style.setProperty("--editor-lineheight", `${state.editorLineHeight.size}em`)
  document.body.style.setProperty("--editor-maxlinewidth", `${state.editorMaxLineWidth.size}em`)
}

/**
 * Set editor typography values as CSS variables on `body`.
 */
 function setMiscellaneousCSSVars(state) {
  // document.body.style.setProperty("--gridoverlay-display", state.developer.showGrid ? 'none' : 'initial')
}




/**
 * Set platform stylesheet on index.html, and
 * set platform style on <body>.
 */
export function setPlatformStylesheet(state) {

  const platform = state.platform

  // Set platform stylesheet on index.html
  const stylesheet = document.getElementById('platform-specific')
  stylesheet.setAttribute('href', `styles/platform/${platform}.css`)

  // Set platform style on <body>.
  document.body.classList.add(platform)

}


/*
 * Set `app-theme` stylesheet href in `index.html`
 * E.g. If app theme id is 'gibsons', then stylesheet 
 * href is './styles/themes/gibsons.css'.
 */
export function setAppThemeStylesheet(state) {
  const themeId = state.appTheme.id
  const stylesheet = document.getElementById('app-theme')
  stylesheet.setAttribute('href', `styles/app-themes/${themeId}.css`)
}

/**
 * Set `editor-theme` stylesheet href in `index.html`
 * E.g. If editor theme name is 'solarized', then stylesheet 
 * href is './styles/themes/editorThemes/solarized.css'.
 */
export function setEditorThemeStylesheet(state) {
  const themeId = state.editorTheme.id
  const stylesheet = document.getElementById('editor-theme')
  stylesheet.setAttribute('href', `styles/editor-themes/${themeId}.css`)
}

