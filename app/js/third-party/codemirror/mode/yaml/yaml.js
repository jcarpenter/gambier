// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("yaml", function () {

    const cons = ['true', 'false', 'on', 'off', 'yes', 'no']
    const keywordRE = new RegExp("\\b((" + cons.join(")|(") + "))$", 'i')
    // Demo: https://regex101.com/r/3TAYBr/1
    const singleTagRE = /^tags:\s[^\[\n\s]+$/
    // Demo: https://regex101.com/r/Viw4pA/1
    const inlineListOfTagsRE = /tags:\s*\[[\W\w]+\]/
    const arrayListItemRE = /\s*-\s+/

    function getStyle(state, spans) {
      let styles = spans ? spans.split(' ') : ['null']

      // Push line styles
      if (state.listStart) styles.push('line-list-start')
      if (state.list) styles.push('line-list')
      if (state.listEnd) styles.push('line-list-end')
      // if (state.listOfTags && (state.list || state.listEnd)) {

      // Check for tags
      // if (state.singleTag || state.inlineListOfTags || state.listOfTags) {
      if (state.inlineListOfTags || state.listOfTags) {
        styles.push('line-tags')
      }

      const isFrontMatterTag = 
        (state.singleTag && styles.includes('null')) ||
        (state.inlineListOfTags && styles.hasAny('string', 'null')) ||
        (state.listOfTags && styles.includes('null'))

      if (isFrontMatterTag) {
        styles.splice(styles.indexOf('null'), 1)
        styles.push('tag')
      }
      
      styles.push('line-frontmatter')

      return styles.join(' ')
    }

    return {
      token: function (stream, state) {

        var ch = stream.peek();
        var esc = state.escaped;
        state.escaped = false;

        /* comments */
        if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
          stream.skipToEnd();
          return getStyle(state, "comment line-comment");
        }

        if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)) {
          return getStyle(state, "string");
        }

        if (state.literal && stream.indentation() > state.keyCol) {
          stream.skipToEnd(); return "string";
        } else if (state.literal) {
          state.literal = false;
        }

        if (stream.sol()) {

          state.singleTag = false
          state.inlineListOfTags = false
          // If list has ended, so has listOfTags.
          // TODO: Revisit this...
          if (state.listEnd) state.listOfTags = false

          state.keyCol = 0;
          state.pair = false;
          state.pairStart = false;
          state.listStart = false;
          state.list = false;
          state.listEnd = false;

          /* document start */
          if (stream.match(/---/)) { return getStyle(state, "md"); }

          /* document end */
          if (stream.match(/\.\.\./)) { return getStyle(state, "md"); }

          /* start of list */
          // pets: <--
          // - dog
          // - cat
          // date: 2021-05-13
          const prevLineIsList = stream.lookAhead(-1)?.match(arrayListItemRE, false)
          const currentLineIsList = stream.match(arrayListItemRE, false)
          const nextLineIsList = stream.lookAhead(1).match(arrayListItemRE, false)
          if (!currentLineIsList && nextLineIsList) {
            state.listStart = true
          }


          /* list item (but not the last one) */
          // pets:
          // - dog <--
          // - cat
          // date: 2021-05-13
          if (currentLineIsList && nextLineIsList) {
            state.list = true
          }

          /* last item of list */
          // pets:
          // - dog
          // - cat <--
          // date: 2021-05-13
          if (currentLineIsList && !nextLineIsList) {
            state.listEnd = true
          }

          /* start of tags list */
          // if (state.listStart && stream.match(/tags:/, false)) {
          const lineStartsWithTags = stream.match(/tags:/, false)

          const isSingleTag =
            lineStartsWithTags &&
            stream.match(singleTagRE, false)

          const isInlineListOfTags =
            !isSingleTag &&
            lineStartsWithTags &&
            stream.match(inlineListOfTagsRE, false)

          const isListOfTags =
            !isInlineListOfTags &&
            lineStartsWithTags &&
            state.listStart

          if (isSingleTag) {
            state.singleTag = true
          } else if (isInlineListOfTags) {
            state.inlineListOfTags = true
          } else if (isListOfTags) {
            state.listOfTags = true
          }

          // /* array list item (not tags) */
          // if (stream.match(arrayListItemRE)) { 

          //   // Is it end of list?
          //   return getStyle(state, "meta list"); 
          // }

          /* tags list: start, continuation, or end */
          // if (stream.match(/tags:/, false)) { 

          //   // Start of tags list
          //   state.listOfTags = true
          //   state.listStart = true

          // } else if (state.listOfTags && stream.match(arrayListItemRE)) {

          //   // Continuation of tags list

          //   // Check if it's end of list
          //   const nextLine = stream.lookAhead(1)
          //   const nextLineIsNotList = !nextLine.match(arrayListItemRE)
          //   if (nextLineIsNotList) {
          //     styles += 'line-list-end'
          //     return getStyle(state, "line-list-end meta list tag");
          //   } else {
          //   }
          //   return getStyle(state, styles);

          // } else if (state.listOfTags) {
          //   // Tags list on previous line does not continue to this line
          //   state.listOfTags = false
          // }

          // /* array list item (not tags) */
          if (stream.match(arrayListItemRE)) { return getStyle(state, "meta"); }
        }

        /* inline pairs/lists */
        if (stream.match(/^(\{|\}|\[|\])/)) {
          if (ch == '{')
            state.inlinePairs++;
          else if (ch == '}')
            state.inlinePairs--;
          else if (ch == '[')
            state.inlineList++;
          else
            state.inlineList--;
          return getStyle(state, 'meta');
        }

        /* list seperator */
        if (state.inlineList > 0 && !esc && ch == ',') {
          stream.next();
          stream.eatSpace();
          return getStyle(state, 'meta');
        }

        /* pairs seperator */
        if (state.inlinePairs > 0 && !esc && ch == ',') {
          state.keyCol = 0;
          state.pair = false;
          state.pairStart = false;
          stream.next();
          return getStyle(state, 'meta');
        }

        /* start of value of a pair */
        if (state.pairStart) {
          /* block literals */
          if (stream.match(/^\s*(\||\>)\s*/)) { state.literal = true; return getStyle(state, 'meta'); };
          /* references */
          if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) { return getStyle(state, 'variable-2'); }
          /* numbers */
          if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) { return getStyle(state, 'number'); }
          if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) { return getStyle(state, 'number'); }
          /* keywords */
          if (stream.match(keywordRE)) { return getStyle(state, 'keyword'); }
        }

        /* pairs (associative arrays) -> key */
        if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
          state.pair = true;
          state.keyCol = stream.indentation();
          return getStyle(state, "atom");
        }
        if (state.pair && stream.match(/^:\s*/)) { state.pairStart = true; return getStyle(state, 'meta'); }

        // If it's vertical list of tags, advance to end of line
        // (so there's one token for the tag)
        if (state.listOfTags) {
          stream.skipToEnd()
          return getStyle(state, null);
        }

        // If it's inline list of tags, advance to end of tag
        // (so there's one token for the tag)
        if (state.inlineListOfTags && stream.match(/[^,\s\]]+/)) {
          return getStyle(state, null);
        }

        // If it's a single tag (e.g. `tags: kitten`), advance
        // to end of tag (so there's one token for it)
        if (state.singleTag) {
          stream.skipToEnd()
          return getStyle(state, null);
        }

        /* nothing found, continue */
        state.pairStart = false;
        state.escaped = (ch == '\\');
        stream.next();
        return getStyle(state, null);
      },
      // NOTE: Josh 5/17/2021: I added this blank line function
      blankLine: function () {
        return 'line-frontmatter'
      },
      startState: function () {
        return {
          pair: false,
          pairStart: false,
          keyCol: 0,
          inlinePairs: 0,
          inlineList: 0,
          literal: false,
          escaped: false,
          listStart: false, // Josh: Added
          list: false, // Josh: Added
          listEnd: false, // Josh: Added
          singleTag: false, // Josh: Added
          inlineListOfTags: false, // Josh: Added
          listOfTags: false, // Josh: Added
        };
      },
      lineComment: "#",
      fold: "indent"
    };
  });

  CodeMirror.defineMIME("text/x-yaml", "yaml");
  CodeMirror.defineMIME("text/yaml", "yaml");

});
