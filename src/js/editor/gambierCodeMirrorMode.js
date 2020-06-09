const yamlOverlay = {
  startState: function () {
    return {
      // frontMatter: false,
    }
  },
  token: function (stream, state) {
    state.combineTokens = true

    if (stream.sol()) {
      stream.next()
      return "line-frontmatter"
    }

    while (stream.next() != null) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
}

const markdownOverlay = {
  startState: function () {
    return {
      frontMatter: false,
    }
  },
  token: function (stream, state) {

    state.combineTokens = null

    let ch

    if (stream.match(/^(-|\*|\+)\s/)) {
      // console.log("L1")
      state.combineTokens = true
      return "line-list1"
    } else if (stream.match(/^\s{2,3}(-|\*|\+)\s/)) {
      // console.log("L2")
      state.combineTokens = true
      return "line-list2"
    } else if (stream.match(/^\s{4,5}(-|\*|\+)\s/)) {
      // console.log("L3")
      state.combineTokens = true
      return "line-list3"
    } else if (stream.match(/^\s{6,7}(-|\*|\+)\s/)) {
      state.combineTokens = true
      return "line-list4"
    }

    // Blockquote
    if (stream.match(">")) {
      // stream.skipToEnd()
      stream.next()
      return "line-blockquote"
    }

    // Header (hash tags)
    // if (stream.sol() && stream.match("#")) {
    if (stream.match("#")) {
      state.combineTokens = true
      return "header-hash"
    }

    // Cite keys
    if (stream.match("[@")) {
      while ((ch = stream.next()) != null)
        if (ch == "]") {
          state.combineTokens = false
          return "citation"
        }
    }

    // Wiki links
    if (stream.match("[[")) {
      while ((ch = stream.next()) != null)
        if (ch == "]" && stream.next() == "]") {
          stream.eat("]")
          state.combineTokens = true
          return "wikilink"
        }
    }

    // Figures
    if (stream.match("![")) {
      stream.skipToEnd()
      return "figure"
    }

    // Links
    // if (stream.match("[")) {
    //   while ((ch = stream.next()) != null)
    //     console.log(stream.baseToken())
    //   if (ch == ")") {
    //     // state.combineTokens = true
    //     return "linkwrapper "
    //   }
    // }

    while (
      stream.next() != null
      // Line
      && !stream.match(">", false)
      && !stream.match("#", false)
      // Inline
      && !stream.match("[@", false)
      && !stream.match("![", false)
      && !stream.match("[[", false)
      // && !stream.match("[", false)
    ) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
}

/**
 * Define "Gambier" mode.
 * Per CodeMirror docs: https://codemirror.net/doc/manual.html#modeapi.
 */
export default GambierCodeMirrorMode = CodeMirror.defineMode("gambier", (config, parserConfig) => {

  const START = 0, FRONTMATTER = 1, BODY = 2

  const yamlMode = CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "yaml" }), yamlOverlay)
  const innerMode = CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "markdown", tokenTypeOverrides: { code: 'code', list1: 'list1', list2: 'list2', list3: 'list3' } }), markdownOverlay)
  // const innerMode = CodeMirror.getMode(config, { name: "markdown" })

  function curMode(state) {
    return state.state == BODY ? innerMode : yamlMode
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
          return yamlMode.token(stream, state.inner)
        } else {
          state.state = BODY
          state.inner = CodeMirror.startState(innerMode)
          return innerMode.token(stream, state.inner)
        }
      } else if (state.state == FRONTMATTER) {
        var end = stream.sol() && stream.match(/(---|\.\.\.)/, false)
        var style = yamlMode.token(stream, state.inner)
        if (end) {
          state.state = BODY
          state.inner = CodeMirror.startState(innerMode)
        }
        return style
      } else {
        return innerMode.token(stream, state.inner)
      }
    },
    innerMode: function (state) {
      return { mode: curMode(state), state: state.inner }
    },
    blankLine: function (state) {
      var mode = curMode(state)
      if (mode.blankLine) return mode.blankLine(state.inner)
    }
  }


  // return CodeMirror.getMode(config, "markdown")
})

// export default GambierCodeMirrorMode = CodeMirror.defineMode("gambier", (config, parserConfig) => {
//   return CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "markdown" }), gambierOverlay)
// })

