import chroma from "chroma-js"
import { stateHasChanged, unEscape, wait } from "../shared/utils"


/**
 * Set initial theme values
 * @param {*} initialColors 
 */
export function init(state) {

  // Set stylsheets
  setTheme(state)
  setSystemColorCSSVars(state)
  setEditorCSSVars(state)
}


/** 
 * Called by StateManager every time state changes (patches) arrive from main.
 * Check what changed and updated css variables for accentColors, etc.
 * @param {*} newState 
 * @param {*} patches 
 */
export async function updateTheme(newState, patches) {

  // Check what has changed
  const isThemeChanged = stateHasChanged(patches, "theme")
  const isSystemColorsChanged = stateHasChanged(patches, "systemColors")
  const isEditorTypographyChanged =
    stateHasChanged(patches, "editorFont") ||
    stateHasChanged(patches, "editorLineHeight") ||
    stateHasChanged(patches, "editorMaxLineWidth")

  // Update
  if (isThemeChanged) setTheme(newState)
  if (isThemeChanged || isSystemColorsChanged) setSystemColorCSSVars(newState)
  if (isEditorTypographyChanged) setEditorCSSVars(newState)

  // const darkModeChanged = stateHasChanged(patches, "darkMode")
  // If any of the above changed, 
  // TODO 4/15: Make it possible to ignore new values from system?
  // E.g. Re-implement override option... Ugh.
  // if (darkModeChanged || appThemeChanged || editorThemeChanged || systemColorsChanged) {
  //   setSystemColorCSSVars(state)
  // }
}


/*
 * Set href of #theme stylesheet on index.html
 * Set `data-theme-isDark` boolean.
 */
export async function setTheme(state) {

  // Set stylesheet
  // If state.theme.id is 'gibsons', then stylesheet 
  // href is './styles/themes/gibsons.css'.
  const stylesheet = document.getElementById('theme')
  stylesheet.setAttribute('href', `styles/${state.theme.id}.css`)

  // Set data-theme-isDark
  document.body.setAttribute('data-theme-isDark', state.theme.isDark)

  // Preload theme images.
  // Have to insert brief pause before-hand, to account for time
  // it takes to load the new stylesheet.
  await wait(25)
  preloadCssImages()
}


/**
 * Set system colors as CSS variables on `body`.
 * TODO: Might want to check if there's a mismatch before updating?
 * This shoudn't be called very often, so probably isn't an issue.
 */
function setSystemColorCSSVars(state) {
  for (const [varName, value] of Object.entries(state.systemColors)) {
    document.body.style.setProperty(`--os-${varName}`, value)
  }
}


/**
 * Set CSS variables for editor-specific values that are driven by state.
 * E.g. Font size, line height.
 */
function setEditorCSSVars(state) {

  document.body.style.setProperty("--editor-fontsize", `${state.editorFont.size}px`)
  document.body.style.setProperty("--editor-lineheight", `${state.editorLineHeight.size}em`)
  document.body.style.setProperty("--editor-maxlinewidth", `${state.editorMaxLineWidth.size * state.editorFont.size}px`)
  document.body.style.setProperty("--editor-maxpadding", `${state.editorFont.size * 4}px`)

  // document.body.style.setProperty("--gridoverlay-display", state.developer.showGrid ? 'none' : 'initial')
}


/**
 * Whenever theme changes, go through CSS files, find
 * linked images, and force them to preload.
 */
function preloadCssImages() {

  let cssVars = []

  // Get theme stylesheet
  const stylesheets = [...document.styleSheets] // Have to convert to Array
  const themeStylesheet = stylesheets.find((s) => s.ownerNode.id == "theme")
  
  // Get rules with "body {...}" selector
  const bodyRules = [...themeStylesheet.rules].filter((r) => r.selectorText == "body")
  
  // Get all css variables on body.
  // Each body rule contains a style object (a `CSSStyleDeclaration`)
  // which is an array of keys, without values. For each body rule, 
  // we iterate the style object and get the values
  let bodyCssVars = []



  for (const rule of bodyRules) {
    for (const style of rule.style) {
      if (style.startsWith("--")) {
        const value = rule.style.getPropertyValue(style)
        if (value.includes("url(")) {
          const url = value.replace(/\s?url\(/, "").replace(")", "").replaceAll(/\\\//g, "/").replaceAll(/\\\./g, ".")
          const preloadLink = document.createElement("link")
          preloadLink.href = "./" + url
          preloadLink.rel = "preload"
          preloadLink.as = "image"
          preloadLink.crossOrigin = "anonymous"
          document.head.appendChild(preloadLink)
        }
      }
    }
  }


  // console.log(bodyCssVars)

  // Get variable names from `rules`
  // for (const s of stylesheets) {
  //   console.log(bodyRules)
  // }


  // Get variable values from body

  // 2. Document.styleSheets
  // 3. getComputedStyle on body (where, by convention, we set variables)



}