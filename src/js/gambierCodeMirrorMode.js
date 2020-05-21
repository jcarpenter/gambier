/**
 * Define "Gambier" mode.
 * Per CodeMirror docs: https://codemirror.net/doc/manual.html#modeapi.
 */
module.exports = CodeMirror.defineMode("gambier", (config, parserConfig) => {
  var gambierOverlay = {
    startState: function () {
      return {
        frontMatter: false,
      }
    },
    token: function (stream, state) {

      state.combineTokens = null

      let ch

      if (state.frontMatter == false && stream.match("---")) {
        state.frontMatter = true
        return "line-frontmatter"
      }

      if (state.frontMatter == true) {

        if (stream.match("---")) {
          state.frontMatter = false
        }

        stream.skipToEnd()
        return "line-frontmatter"
      }

      // Cite keys
      if (stream.match("[@")) {
        while ((ch = stream.next()) != null)
          if (ch == "]") {
            state.combineTokens = true
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
        return "line-figure"
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
        && !stream.match("---", false)
        && !stream.match("[@", false)
        && !stream.match("![", false)
        && !stream.match("[[", false)
        // && !stream.match("[", false)
      ) { }

      // If we don't do any of the above, return null (token does not need to be styled)
      return null
    }
  }
  return CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "markdown" }), gambierOverlay)
})

