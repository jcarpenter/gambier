const yamlOverlay = {
  startState: function () {
    return {
      frontMatter: false,
    }
  },
  token: function (stream, state) {
    state.combineTokens = true

    // Mark lines as `frontmatter`

    if (stream.sol()) {

      if (stream.match(/---/, false)) {
        state.frontMatter = state.frontMatter ? false : true
        stream.next()
        return "line-frontmatter"
      }

      if (state.frontMatter) {
        stream.next()
        return "line-frontmatter"
      }
    }

    while (stream.next() != null) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
}

const markdownOverlayOLD = {
  startState: () => {
    return {
      frontMatter: false,
      list_ul: false,
      emphasis: false
    }
  },
  token: (stream, state) => {

    // state.combineTokens = null

    // if (!state.emphasis) {
    //   state.emphasis = true
    // } else if (stream.sol() && state.emphasis) {
    //   state.combineTokens = true
    //   return 'line-emphasis'
    // }

    // let ch

    // if (stream.sol() && state.emphasis) {
    // }

    // Demo: https://regex101.com/r/1MR7Tg/1
    // if (stream.sol()) {
    //   if (stream.match(/^(-|\*|\+)\s/)) {
    //     // state.combineTokens = true
    //     state.list_ul = true
    //     // return "line-list1"
    //     // } else if (stream.match(/^(-|\*|\+)\s/)) {
    //     // state.list_ul = true
    //     return "line-list1"
    //   } else if (stream.match(/^\s{2,3}(-|\*|\+)\s/)) {
    //     state.combineTokens = true
    //     return "line-list2"
    //   } else if (stream.match(/^\s{4,5}(-|\*|\+)\s/)) {
    //     state.combineTokens = true
    //     return "line-list3"
    //   } else if (stream.match(/^\s{6, 7}(-|\*|\+)\s/)) {
    //     state.combineTokens = true
    //     return "line-list4"
    //   }
    // }

    // Blockquote 
    // if (stream.sol() && stream.match(/^>\s/)) {
    //   // stream.skipToEnd()
    //   stream.next()
    //   return "line-blockquote"
    // }

    // // Strong - Flanking ** characters
    // if (stream.match('**')) {
    //   state.combineTokens = true
    //   return 'flank'
    // }

    // // Emphasis - Flanking _ characters
    // if (stream.match(' _') || stream.match('_ ')) {
    //   state.combineTokens = true
    //   return 'flank'
    // }

    // // Code - Flanking ` characters
    // if (stream.match('`')) {
    //   state.combineTokens = true
    //   return 'flank'
    // }

    // // Header (hash tags)
    // if (stream.sol() && stream.match(/^#{1,5}/)) {
    //   state.combineTokens = true
    //   return "header-hash"
    // }

    // Cite keys
    if (stream.match("[@")) {
      while ((ch = stream.next()) != null)
        if (ch == "]") {
          state.combineTokens = false
          return "citation"
        }
    }

    // Wiki links
    // if (stream.match("[[")) {
    //   while ((ch = stream.next()) != null)
    //     if (ch == "]" && stream.next() == "]") {
    //       stream.eat("]")
    //       state.combineTokens = true
    //       return "wikilink"
    //     }
    // }

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
      && !stream.match("**", false)
      && !stream.match(" _", false)
      && !stream.match("_ ", false)
      && !stream.match("`", false)
      && !stream.match("[@", false)
      && !stream.match("![", false)
      && !stream.match("[[", false)
      // && !stream.match("[", false)
    ) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
}

const markdownOverlay = {

  // State object: Is always passed when reading a token, and which can be mutated by the tokenizer.
  // Modes that use a state must define a `startState` method on their mode object.

  startState: () => {
    return {
      fencedCodeBlock: false,
      texMathDisplay: false,
    }
  },

  // Tokenizer (lexer): All modes must define this method. Takes a character stream as input, reads one token from the stream, advances it past a token, optionally update its state, and return a style string, or null for tokens that do not have to be styled.

  // Multiple styles can be returned (separated by spaces), for example "string error" for a thing that looks like a string but is invalid somehow (say, missing its closing quote). When a style is prefixed by "line-" or "line-background-", the style will be applied to the whole line

  // The stream object that's passed to token encapsulates a line of code (tokens may never span lines) and our current position in that line. 

  token: (stream, state) => {

    state.combineTokens = true

    /*
    Style lines: We apply line styles in our overlay when we cannot apply them in the underlying markdown.js mode. This happens when we delegate styling to another mode, as in the case of fenced code blocks, TeX math, etc. 
    */

    if (stream.sol()) {

      // ----- Fenced code block: Style line ----- //

      // NOTE: Regex taken from underlying markdown mode
      if (!state.fencedCodeBlock && stream.match(/^(~~~+|```+)[ \t]*([\w+#-]*)[^\n`]*$/)) {
        state.fencedCodeBlock = true
        stream.skipToEnd()
        return 'line-fencedcodeblock'
      } else if (state.fencedCodeBlock) {
        // If we've reached the end, stop the state
        if (stream.match(/^(~~~+|```+)/)) state.fencedCodeBlock = false
        // console.log(stream)
        stream.skipToEnd()
        return 'line-fencedcodeblock'
      }

      // ----- TeX math equation: Style line ----- //
      
      // NOTE: Regex taken from underlying markdown mode
      if (!state.texMathDisplay && stream.match(/^\$\$$/)) {
        state.texMathDisplay = true
        stream.skipToEnd()
        return 'line-texmath-display'
      } else if (state.texMathDisplay) {
        // If we've reached the end, stop the state
        if (stream.match(/^\$\$$/)) {
          state.texMathDisplay = false
          stream.skipToEnd()
          return 'line-texmath-display md'
        } else {
          stream.skipToEnd()
          return 'line-texmath-display'
        }
      }
    }

    // Advance 
    if (stream.next() != null) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  },

  blankLine: function (state) {

    // Style blank lines for multi-line 
    if (state.fencedCodeBlock) {
      return 'line-fencedcodeblock'
    } else if (state.texMathEquation) {
      return `line-texmath-display`
    }

    return
  }
}


/**
 * Define custom mode to be used with CodeMirror.
 */
function defineGambierMode() {
  CodeMirror.defineMode("gambier", (config, parsegrConfig) => {

    const START = 0, FRONTMATTER = 1, BODY = 2

    const yamlMode = CodeMirror.overlayMode(CodeMirror.getMode(config, {
      name: "yaml"
    }), yamlOverlay)

    const markdownMode = CodeMirror.overlayMode(CodeMirror.getMode(config, {
      name: 'markdown',
      taskLists: true,
      strikethrough: true,
      fencedCodeBlockHighlighting: true,
      fencedCodeBlockDefaultMode: 'javascript',
      // highlightFormatting: true,
    }), markdownOverlay)

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
            return yamlMode.token(stream, state.inner)
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

        // if (state.inner.overlay.fencedCodeBlock) return 'line-fencedcodeblock'
        if (mode.blankLine) return mode.blankLine(state.inner)
      }
    }
  })
}


/**
 * Define "Gambier" mode.
 * Per CodeMirror docs: https://codemirror.net/doc/manual.html#modeapi.
 */
export default defineGambierMode