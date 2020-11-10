import { hasChanged } from "../shared/utils"

export class ThemeManager {
  constructor(initialState) {

    this.root = document.documentElement

    window.api.receive("stateChanged", (state, oldState) => {

      // Update appearance
      if (hasChanged('appearance', state, oldState)) {
        this.setTheme(state.appearance.theme)
        this.setSystemColors()
      }
    })

    // Set initial theme on initial load
    this.setTheme(initialState.appearance.theme)

    // Set system colors
    this.setSystemColors()
  }


  /**
   * Point stylesheet href in index.html to new theme's stylesheet.
   * If stylesheet name = gambier-light
   * ...stylesheet href = ./styles/themes/gambier-light/gambier-light.css
   * @param {*} themeName - E.g. 'gambier-light'.
   */
  setTheme(themeName) {  
    const stylesheet = document.getElementById('theme-stylesheet')
    const href = `./styles/themes/${themeName}/${themeName}.css`
    stylesheet.setAttribute('href', href)
  }

  /**
   * Get system colors from main, and write them to html element.
   * NOTE: This is turned off for now because of problems with Electron: returned values do not match what we expect from macOS, based on developer documentation and tests with Xcode apps. In part (although not entirely) because Electron returns values without alphas.
   */
  async setSystemColors() {

    return

    const systemColors = await window.api.invoke('getSystemColors')
    systemColors.forEach((c) => {
      const property = `--${c.name}`
      const value = `${c.color}`
      // console.log(property, value)
      // const rgb = this.hexToRgb(value)
      // this.root.style.setProperty(property, value)
    });
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}