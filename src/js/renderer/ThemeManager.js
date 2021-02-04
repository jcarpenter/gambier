import { stateHasChanged } from "../shared/utils"


/**
 * Set initial theme values
 * @param {*} initialColors 
 */
export function init(initialState, initialColors) {
  
  // Set initial values
  setCSSVariables(initialColors.colors)
  setEditorThemeStylesheet(initialState.theme.editorTheme)
}

export async function updateTheme(newState, patches) {
  const darkModeChanged = stateHasChanged(patches, ["darkMode"])
  const themeChanged = stateHasChanged(patches, "theme")
  
  if (darkModeChanged || themeChanged) {
    const observeThemeOverrides = window.id !== 'preferences'
    const { colors } = await window.api.invoke('getColors', observeThemeOverrides)
    setCSSVariables(colors)
    console.log(colors)
  }

  if (themeChanged) {
    setEditorThemeStylesheet(newState.theme.editorTheme)
  }
}


/**
 * Set CSS variables on the `body` element
 * @param {*} colors 
 */
function setCSSVariables(colors) {
  for (const [varName, rgbaHex] of Object.entries(colors)) {
    document.body.style.setProperty(`--${varName}`, rgbaHex)
  }
}

/**
 * Set `editor-theme` stylesheet href in `index.html`
 * E.g. If editor theme name is 'solarized', then stylesheet 
 * href is './styles/themes/solarized/solarized.css'.
 */
export function setEditorThemeStylesheet(themeName) {
  const stylesheet = document.getElementById('editor-theme')
  const url = `./styles/editorThemes/${themeName}.css`
  stylesheet.setAttribute('href', url)
}

