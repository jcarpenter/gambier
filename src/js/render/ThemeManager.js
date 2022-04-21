import { stateHasChanged, wait } from "../shared/utils"


/**
 * Set initial theme values
 * @param {*} initialColors 
 */
export async function init(state) {

  // Set stylsheets
  await setTheme(state)
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
  if (isThemeChanged) await setTheme(newState)
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
  const url = `styles/${state.theme.id}.css`
  stylesheet.setAttribute('href', url)

  // Set data-theme-isDark
  document.body.setAttribute('data-theme-isDark', state.theme.isDark)

  // Wait for stylesheet to load
  // await new Promise((resolve) => {
  //   stylesheet.onload = () => resolve()
  // })

  // Preload theme images.
  // Have to insert brief pause before-hand, to account for time
  // it takes to load the new stylesheet.
  await wait(25)
  await preloadCssImages()
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
 * Preload theme's CSS images.
 * Whenever theme changes, find the CSS image variables defined
 * in the new theme, and add a `link rel=preload` for each.
 * This forces the browser to preload the images.
 */
async function preloadCssImages() {

  // Get theme stylesheet
  const stylesheets = [...document.styleSheets] // Have to convert to Array
  const themeStylesheet = stylesheets.find((s) => s.ownerNode.id == "theme")
  
  // Get theme stylesheet's rules for the body element.
  // By convention we define theme image CSS variables
  // on the body (and most/all other variables).
  const bodyRules = [...themeStylesheet.rules].filter((r) => r.selectorText == "body")
 
  // We listen for all images to load before finished function
  // We push a promise 
  let imagesLoading = []

  // Find the CSS variables on body that include a `url(...)` 
  // in their value, and then force those URLs to preload by
  // creating `link rel=preload` elements in `head` for each.
  for (const rule of bodyRules) {

    // Each body rule contains a style object (a `CSSStyleDeclaration`)
    // which is an array of keys, without values. For each body rule, 
    // we go through the style array, find entries that are CSS variables
    // (they start with `--`), and if their value contains URL, create
    // link elements for that URL.
    for (const key of rule.style) {
      if (key.startsWith("--")) {
        const value = rule.style.getPropertyValue(key)
        if (value.includes("url(")) {
          // Clean up the returned URL.
          // Before: url(\/img\/ui\/checkmark\.small\.heavy\.svg)
          // After:  /img/ui/checkmark.small.heavy.svg
          const url = value.replace(/\s?url\(/, "").replace(")", "").replaceAll(/\\\//g, "/").replaceAll(/\\\./g, ".")
          const isAlreadyPreloaded = document.head.querySelector(`link[href="${url}"]`)
          if (!isAlreadyPreloaded) {
            const preloadLink = document.createElement("link")
            preloadLink.href = url
            preloadLink.rel = "preload"
            preloadLink.as = "image"
            preloadLink.crossOrigin = "anonymous"
            document.head.appendChild(preloadLink)
            const img = new Image()
            img.src = url
            // Listen for when image is loaded and ready to use
            imagesLoading.push(img.decode())
          }
        }
      }
    }
  }

  // Only let function finish once all images are loaded and ready to use
  await Promise.all(imagesLoading)
}