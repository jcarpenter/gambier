/**
 * Define custom "Gambier" mode to be used with CodeMirror.
 * Per: https://codemirror.net/doc/manual.html#modeapi
 */
export function defineGambierMode() {
  CodeMirror.defineMode("gambier", (config, modeConfig) => {

    /* 
    - config = "...a CodeMirror configuration object (the thing passed to the CodeMirror function)".
    - modeConfig = "...an optional mode configuration object (as in the mode option), returns a mode object".
    https://codemirror.net/doc/manual.html#modeapi
    */

    const START = 0, FRONTMATTER = 1, BODY = 2

    const yamlMode = CodeMirror.getMode(config, { name: "yaml" })

    const markdownMode = CodeMirror.getMode(config, {
      name: 'markdown',
      taskLists: true,
      strikethrough: true,
      fencedCodeBlockHighlighting: true,
      fencedCodeBlockDefaultMode: 'javascript',
      ...modeConfig.markdownOptions
    })

    function curMode(state) {
      return state.state == BODY ? markdownMode : yamlMode
    }

    return {
      startState: function () {
        return {
          state: START,
          inner: CodeMirror.startState(yamlMode)
        }
      },
      copyState: function (state) {
        return {
          state: state.state,
          inner: CodeMirror.copyState(curMode(state), state.inner)
        }
      },
      token: function (stream, state) {
        if (state.state == START) {
          if (stream.match(/---/, false)) {
            state.state = FRONTMATTER
            const style = yamlMode.token(stream, state.inner)
            return `line-frontmatter-start ${style}`
          } else {
            state.state = BODY
            state.inner = CodeMirror.startState(markdownMode)
            return markdownMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/(---|\.\.\.)/, false)
          var style = yamlMode.token(stream, state.inner)
          if (end) {
            state.state = BODY
            state.inner = CodeMirror.startState(markdownMode)
            style = `line-frontmatter-end ${style}`
            return style
          }
          return style
        } else {
          return markdownMode.token(stream, state.inner)
        }
      },
      innerMode: function (state) {
        return { mode: curMode(state), state: state.inner }
      },
      blankLine: function (state) {
        var mode = curMode(state)
        if (mode.blankLine) {
          return mode.blankLine(state.inner)
        }
      }
    }
  })
}