import { stateHasChanged } from "../shared/utils"


/**
 * Set initial theme values
 * @param {*} initialColors 
 */
export function init(state) {

  // Set stylsheets
  setThemeStylesheet(state)
  setSystemColorCSSVars(state)
  setOtherCSSVars(state)
}


/** 
 * Called by StateManager every time state changes (patches) arrive from main.
 * Check what changed and updated css variables for accentColors, etc.
 * @param {*} newState 
 * @param {*} patches 
 */
export async function updateTheme(newState, patches) {

  // Set theme
  if (stateHasChanged(patches, "theme")) {
    setThemeStylesheet(newState)
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

  // Set other css variables
  const editorTypographyChanged =
    stateHasChanged(patches, "editorFont") ||
    stateHasChanged(patches, "editorLineHeight") ||
    stateHasChanged(patches, "editorMaxLineWidth")

  if (editorTypographyChanged) {
    setOtherCSSVars(state)
  }
}


/*
 * Set `theme` id stylesheet href in `index.html`
 * E.g. If state.theme.id is 'gibsons', then stylesheet 
 * href is './styles/themes/gibsons.css'.
 */
export function setThemeStylesheet(state) {
  const stylesheet = document.getElementById('theme')
  stylesheet.setAttribute('href', `styles/${state.theme.id}.css`)
}


/**
 * Set system colors as CSS variables on `body`.
 * TODO: Might want to check if there's a mismatch before updating?
 * This shoudn't be called very often, so probably isn't an issue.
 */
 function setSystemColorCSSVars(state) {
  for (const [varName, rgbaHex] of Object.entries(state.systemColors)) {
    document.body.style.setProperty(`--${varName}`, rgbaHex)
  }
}

/**
 * Set editor typography values as CSS variables on `body`.
 */
function setOtherCSSVars(state) {
 
  document.body.style.setProperty("--editor-fontsize", `${state.editorFont.size}px`)
  
  document.body.style.setProperty("--editor-lineheight", `${state.editorLineHeight.size}em`)
  
  document.body.style.setProperty("--editor-maxlinewidth", `${state.editorMaxLineWidth.size * state.editorFont.size}px`)
  
  document.body.style.setProperty("--editor-maxpadding", `${state.editorFont.size * 4}px`)

  // document.body.style.setProperty("--gridoverlay-display", state.developer.showGrid ? 'none' : 'initial')
}

