// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../meta"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../meta"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("markdown", function (cmCfg, modeCfg) {

    var htmlMode = CodeMirror.getMode(cmCfg, "text/html");
    var htmlModeMissing = htmlMode.name == "null"

    function getMode(name) {
      if (CodeMirror.findModeByName) {
        var found = CodeMirror.findModeByName(name);
        if (found) name = found.mime || found.mimes[0];
      }
      var mode = CodeMirror.getMode(cmCfg, name);
      return mode.name == "null" ? null : mode;
    }

    // Should characters that affect highlighting be highlighted separate?
    // Does not include characters that will be output (such as `1.` and `-` for lists)
    if (modeCfg.highlightFormatting === undefined)
      modeCfg.highlightFormatting = false;

    // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
    // Excess `>` will emit `error` token.
    if (modeCfg.maxBlockquoteDepth === undefined)
      modeCfg.maxBlockquoteDepth = 0;

    // Turn on task lists? ("- [ ] " and "- [x] ")
    if (modeCfg.taskLists === undefined) modeCfg.taskLists = false;

    // Turn on strikethrough syntax
    if (modeCfg.strikethrough === undefined)
      modeCfg.strikethrough = false;

    if (modeCfg.emoji === undefined)
      modeCfg.emoji = false;

    if (modeCfg.fencedCodeBlockHighlighting === undefined)
      modeCfg.fencedCodeBlockHighlighting = true;

    if (modeCfg.fencedCodeBlockDefaultMode === undefined)
      modeCfg.fencedCodeBlockDefaultMode = '';

    if (modeCfg.xml === undefined)
      modeCfg.xml = true;

    // Allow token types to be overridden by user-provided token types.
    if (modeCfg.tokenTypeOverrides === undefined)
      modeCfg.tokenTypeOverrides = {};

    var tokenTypes = {

      // Blocks
      header: "line-header", // was 'header'
      hr: "line-hr", // was 'hr'
      list1: "line-list-1", // was 'variable-2'
      list2: "line-list-2", // was 'variable-3'
      list3: "line-list-3", // was 'keyword'
      list4: "line-list-4",
      list5: "line-list-5",
      list6: "line-list-6",
      listUl: "line-ul",
      listOl: "line-ol",
      taskOpen: "line-taskOpen",
      taskClosed: "line-taskClosed",
      quote: "line-quote", // was 'quote'
      figure: "line-figure",
      // codeBlock: 'line-codeBlock',

      // Spans
      formatting: "md", // was 'formatting'

      citation: "citation",

      footnoteInline: "footnote-inline",
      footnoteReferenceId: "footnote-reference-id",
      footnoteReference: "line-footnote-reference",

      image: "img",
      imageMarker: "marker",
      imageAltText: "alttext",
      imageUrl: "url",
      imageTitle: "title",

      link: "link",
      linkInline: "inline",
      linkReference: "reference",
      linkReferenceDefinition: "reference-definition",
      linkText: "text",
      linkLabel: "label",
      linkUrl: "url",
      linkTitle: "title",

      autolinkUrl: "autolink-url",
      autolinkEmail: "autolink-email",

      code: "code", // was 'comment'
      em: "em",
      strong: "strong",
      strikethrough: "strikethrough",
      emoji: "builtin"
    };

    for (var tokenType in tokenTypes) {
      if (tokenTypes.hasOwnProperty(tokenType) && modeCfg.tokenTypeOverrides[tokenType]) {
        tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
      }
    }

    var hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/
      , figureRE = /^![^\]]*\](\(.*?\)| ?\[.*?\])/
      , listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/
      , taskListRE = /^\[(x| )\](?=\s)/i // Must follow listRE
      , atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/
      , setextHeaderRE = /^ {0,3}(?:\={1,}|-{2,})\s*$/
      , textRE = /^[^#!\[\]*_\\<>^` "'(~:]+/
      , fencedCodeRE = /^(~~~+|```+)[ \t]*([\w+#-]*)[^\n`]*$/
      , linkUrlRE = /\s*(?:<[^<>\n]*>|(?!<)[^\s]+)/
      , linkTitleRE = /\s(".*?")|\s('.*?')|\s(\(.*?\))/
      , linkRefDefintionRE = /^\[[^\]]+?\]:\s*(?:<[^<>\n]*>|(?!<)[^\s]+)/
      , linkDefRE = /^\s*\[[^\]]+?\]:.*$/ // naive link-definition
      , punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/
      , expandedTab = "    " // CommonMark specifies tab as 4 spaces


    var linkRefFullOrCollapsedRE = /[^\]]+?\]\[.*?\]/

    function switchInline(stream, state, f) {
      state.f = state.inline = f;
      return f(stream, state);
    }

    function switchBlock(stream, state, f) {
      state.f = state.block = f;
      return f(stream, state);
    }

    function lineIsEmpty(line) {
      return !line || !/\S/.test(line.string)
    }

    // Blocks

    function blankLine(state) {

      // Reset link states
      state.link = false;
      state.linkReferenceDefinition = false;
      state.linkLabel = false;
      state.linkTitle = false;
      state.linkUrl = false;
      state.linkText = false;

      // Reset EM state
      state.em = false;
      // Reset STRONG state
      state.strong = false;
      // Reset strikethrough state
      state.strikethrough = false;
      // Reset state.quote
      state.quote = 0;
      // Reset state.indentedCode
      state.indentedCode = false;
      if (state.f == htmlBlock) {
        var exit = htmlModeMissing
        if (!exit) {
          var inner = CodeMirror.innerMode(htmlMode, state.htmlState)
          exit = inner.mode.name == "xml" && inner.state.tagStart === null &&
            (!inner.state.context && inner.state.tokenize.isInText)
        }
        if (exit) {
          state.f = inlineNormal;
          state.block = blockNormal;
          state.htmlState = null;
        }
      }
      // Reset state.trailingSpace
      state.trailingSpace = 0;
      state.trailingSpaceNewLine = false;
      // Mark this line as blank
      state.prevLine = state.thisLine
      state.thisLine = { stream: null }
      return null;
    }

    function blockNormal(stream, state) {

      var firstTokenOnLine = stream.column() === state.indentation;
      var prevLineLineIsEmpty = lineIsEmpty(state.prevLine.stream);
      var prevLineIsIndentedCode = state.indentedCode;
      var prevLineIsHr = state.prevLine.hr;
      var prevLineIsList = state.list !== false;
      var maxNonCodeIndentation = (state.listStack[state.listStack.length - 1] || 0) + 3;

      state.indentedCode = false;

      // Determine line indentation
      var lineIndentation = state.indentation;
      // compute once per line (on first token)
      if (state.indentationDiff === null) {
        state.indentationDiff = state.indentation;
        if (prevLineIsList) {
          state.list = null;
          // While this list item's marker's indentation is less than the deepest
          //  list item's content's indentation,pop the deepest list item
          //  indentation off the stack, and update block indentation state
          while (lineIndentation < state.listStack[state.listStack.length - 1]) {
            state.listStack.pop();
            if (state.listStack.length) {
              state.indentation = state.listStack[state.listStack.length - 1];
              // less than the first list's indent -> the line is no longer a list
            } else {
              state.list = false;
            }
          }
          if (state.list !== false) {
            state.indentationDiff = lineIndentation - state.listStack[state.listStack.length - 1]
          }
        }
      }

      // not comprehensive (currently only for setext detection purposes)
      var allowsInlineContinuation = (
        !prevLineLineIsEmpty && !prevLineIsHr && !state.prevLine.header &&
        (!prevLineIsList || !prevLineIsIndentedCode) &&
        !state.prevLine.fencedCodeEnd
      );

      var isHr = (state.list === false || prevLineIsHr || prevLineLineIsEmpty) &&
        state.indentation <= maxNonCodeIndentation && stream.match(hrRE);

      var match = null;

      if (state.indentationDiff >= 4 && (prevLineIsIndentedCode || state.prevLine.fencedCodeEnd ||
        state.prevLine.header || prevLineLineIsEmpty)) {

        // -----  Indented code(?) ----- //
        stream.skipToEnd();
        state.indentedCode = true;
        return tokenTypes.code;

      } else if (stream.eatSpace()) {

        return null;

      } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(atxHeaderRE)) && match[1].length <= 6) {

        // -----  Header ----- //
        state.quote = 0;
        state.header = match[1].length;
        state.thisLine.header = true;
        if (modeCfg.highlightFormatting) state.formatting = "header";
        state.f = state.inline;
        return getType(state);

      } else if (state.indentation <= maxNonCodeIndentation && stream.eat('>')) {

        // -----  Block quote ----- //
        state.quote = firstTokenOnLine ? 1 : state.quote + 1;
        if (modeCfg.highlightFormatting) state.formatting = "quote";
        stream.eatSpace();
        return getType(state);

      } else if (!isHr && !state.setext && firstTokenOnLine && stream.match(/^\[\^\S*\]: /, false)) {

        // ----- Reference footnote: definition ----- //
        state.footnoteReference = true
        if (modeCfg.highlightFormatting) state.formatting = "footnote-reference"; // TODO: Use this
        state.f = state.inline;
        return getType(state);

      } else if (!isHr && !state.setext && stream.column() <= 3 && stream.match(linkRefDefintionRE, false)) {

        // ----- Reference link: definition ----- //
        return switchInline(stream, state, linkReferenceDefinition);
        // return tokenTypes.linkReferenceDefinition

      } else if (!isHr && !state.setext && firstTokenOnLine && stream.match(figureRE, false)) {

        // ----- Figure ----- //
        state.figure = true
        if (modeCfg.highlightFormatting) state.formatting = "figure"; // TODO: Use this
        state.f = state.inline;
        return getType(state);


      } else if (!isHr && !state.setext && firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(listRE))) {

        // ----- List ----- //
        var listType = match[1] ? "ol" : "ul";
        state.listType = listType

        state.indentation = lineIndentation + stream.current().length;
        state.list = true;
        state.quote = 0;

        // Add this list item's content's indentation to the stack
        state.listStack.push(state.indentation);
        // Reset inline styles which shouldn't propagate aross list items
        state.em = false;
        state.strong = false;
        state.code = false;
        state.strikethrough = false;

        if (modeCfg.taskLists && stream.match(taskListRE, false)) state.taskList = true;
        state.f = state.inline;
        if (modeCfg.highlightFormatting) state.formatting = ["list", "list-" + listType];
        return getType(state);

      } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(fencedCodeRE, true))) {

        // ----- CodeBlock ----- //
        state.quote = 0;
        state.fencedEndRE = new RegExp(match[1] + "+ *$");
        // try switching mode
        state.localMode = modeCfg.fencedCodeBlockHighlighting && getMode(match[2] || modeCfg.fencedCodeBlockDefaultMode);
        if (state.localMode) state.localState = CodeMirror.startState(state.localMode);
        state.f = state.block = local;
        if (modeCfg.highlightFormatting) state.formatting = "code-block";
        state.code = -1
        return getType(state);
        // SETEXT has lowest block-scope precedence after HR, so check it after
        //  the others (code, blockquote, list...)

      } else if (
        // if setext set, indicates line after ---/===
        state.setext || (
          // line before ---/===
          (!allowsInlineContinuation || !prevLineIsList) && !state.quote && state.list === false &&
          !state.code && !isHr && !linkDefRE.test(stream.string) &&
          (match = stream.lookAhead(1)) && (match = match.match(setextHeaderRE))
        )
      ) {

        // ----- Not sure what this bit does... ----- //

        if (!state.setext) {
          state.header = match[0].charAt(0) == '=' ? 1 : 2;
          state.setext = state.header;
        } else {
          state.header = state.setext;
          // has no effect on type so we can reset it now
          state.setext = 0;
          stream.skipToEnd();
          if (modeCfg.highlightFormatting) state.formatting = "header";
        }
        state.thisLine.header = true;
        state.f = state.inline;
        return getType(state);

      } else if (isHr) {
        stream.skipToEnd();
        state.hr = true;
        state.thisLine.hr = true;
        return tokenTypes.hr;
      } else if (stream.peek() === '[') {

        // ----- Reference link definition ----- //

        // return switchInline(stream, state, footnoteReferenceDefinition);
      }

      // No block-level elements found. Proceed with inline processing...
      return switchInline(stream, state, state.inline);
    }



    function htmlBlock(stream, state) {
      var style = htmlMode.token(stream, state.htmlState);
      if (!htmlModeMissing) {
        var inner = CodeMirror.innerMode(htmlMode, state.htmlState)
        if ((inner.mode.name == "xml" && inner.state.tagStart === null &&
          (!inner.state.context && inner.state.tokenize.isInText)) ||
          (state.md_inside && stream.current().indexOf(">") > -1)) {
          console.log("Exit 1")
          state.f = inlineNormal;
          state.block = blockNormal;
          state.htmlState = null;
        }
      }
      return style;
    }

    function local(stream, state) {
      var currListInd = state.listStack[state.listStack.length - 1] || 0;
      var hasExitedList = state.indentation < currListInd;
      var maxFencedEndInd = currListInd + 3;
      if (state.fencedEndRE && state.indentation <= maxFencedEndInd && (hasExitedList || stream.match(state.fencedEndRE))) {
        if (modeCfg.highlightFormatting) state.formatting = "code-block";
        var returnType;
        if (!hasExitedList) returnType = getType(state)
        state.localMode = state.localState = null;
        state.block = blockNormal;
        state.f = inlineNormal;
        state.fencedEndRE = null;
        state.code = 0
        state.thisLine.fencedCodeEnd = true;
        if (hasExitedList) return switchBlock(stream, state, state.block);
        return returnType;
      } else if (state.localMode) {
        return state.localMode.token(stream, state.localState);
      } else {
        stream.skipToEnd();
        return tokenTypes.code;
      }
    }

    function getType(state) {
      var styles = [];

      if (state.formatting) {
        styles.push(tokenTypes.formatting);

        if (typeof state.formatting === "string") state.formatting = [state.formatting];

        for (var i = 0; i < state.formatting.length; i++) {
          styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

          if (state.formatting[i] === "header") {
            styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
          }

          // Add `formatting-quote` and `formatting-quote-#` for blockquotes
          // Add `error` instead if the maximum blockquote nesting depth is passed
          if (state.formatting[i] === "quote") {
            if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
              styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
            } else {
              styles.push("error");
            }
          }
        }
      }

      // Task list
      if (state.taskOpen) {
        styles.push(tokenTypes.taskOpen);
        return styles.length ? styles.join(' ') : null;
      }

      if (state.taskClosed) {
        styles.push(tokenTypes.taskClosed);
        return styles.length ? styles.join(' ') : null;
      }

      // Image
      if (state.image) {
        styles.push(tokenTypes.image);
        if (state.imageMarker) { styles.push(tokenTypes.imageMarker); }
        if (state.imageAltText) { styles.push(tokenTypes.imageAltText); }
        if (state.linkUrl) { styles.push(tokenTypes.imageUrl); }
        if (state.linkTitle) { styles.push(tokenTypes.imageTitle); }
      }

      // Link
      if (state.link) {
        styles.push(tokenTypes.link);
        if (state.linkInline) { styles.push(tokenTypes.linkInline); }
        if (state.linkReference) { styles.push(tokenTypes.linkReference); }
        if (state.linkReferenceDefinition) { styles.push(tokenTypes.linkReferenceDefinition); }
        if (state.linkText) { styles.push(tokenTypes.linkText); }
        if (state.linkLabel) { styles.push(tokenTypes.linkLabel); }
        if (state.linkUrl) { styles.push(tokenTypes.linkUrl); }
        if (state.linkTitle) { styles.push(tokenTypes.linkTitle); }
      }

      // Other states

      if (state.footnoteInline) styles.push(tokenTypes.footnoteInline);
      if (state.footnoteReferenceId) styles.push(tokenTypes.footnoteReferenceId);
      if (state.footnoteReference) styles.push(tokenTypes.footnoteReference);
      if (state.citation) styles.push(tokenTypes.citation);
      if (state.figure) styles.push(tokenTypes.figure);
      if (state.strong) styles.push(tokenTypes.strong);
      if (state.em) styles.push(tokenTypes.em);
      if (state.strikethrough) styles.push(tokenTypes.strikethrough);
      if (state.emoji) styles.push(tokenTypes.emoji);
      if (state.code) styles.push(tokenTypes.code);
      if (state.header) styles.push(tokenTypes.header, "line-h" + state.header);

      // Block quote
      if (state.quote) {
        styles.push(tokenTypes.quote);

        // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
        if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
          styles.push(tokenTypes.quote + "-" + state.quote);
        } else {
          styles.push(tokenTypes.quote + "-" + modeCfg.maxBlockquoteDepth);
        }
      }

      // List
      if (state.list !== false) {

        // Set depth
        var listMod = (state.listStack.length - 1);
        switch (listMod) {
          case 0:
            styles.push(tokenTypes.list1);
            break;
          case 1:
            styles.push(tokenTypes.list2);
            break;
          case 2:
            styles.push(tokenTypes.list3);
            break;
          case 3:
            styles.push(tokenTypes.list4);
            break;
          case 4:
            styles.push(tokenTypes.list5);
            break;
          case 5:
            styles.push(tokenTypes.list6);
            break;
        }

        // Set type
        switch (state.listType) {
          case 'ul':
            styles.push(tokenTypes.listUl)
            break
          case 'ol':
            styles.push(tokenTypes.listOl)
            break
        }
      }

      if (state.trailingSpaceNewLine) {
        styles.push("trailing-space-new-line");
      } else if (state.trailingSpace) {
        styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
      }

      return styles.length ? styles.join(' ') : null;
    }

    /**
     * Advanced stream to next instance of a markdown formatting character 
     * If no markdown characters exist, return `undefined`.
     * @param {*} stream 
     * @param {*} state 
     */
    function handleText(stream, state) {
      if (stream.match(textRE, true)) {
        return getType(state);
      }
      return undefined;
    }


    function inlineNormal(stream, state) {
      var style = state.text(stream, state);
      if (typeof style !== 'undefined')
        return style;

      // List
      if (state.list) { // List marker (*, +, -, 1., etc)
        state.list = null;
        return getType(state);
      }

      // Task list
      if (state.taskList) {
        var taskOpen = stream.match(taskListRE, true)[1] === " ";
        if (taskOpen) state.taskOpen = true;
        else state.taskClosed = true;
        if (modeCfg.highlightFormatting) state.formatting = "task";
        state.taskList = false;
        return getType(state);
      }

      state.taskOpen = false;
      state.taskClosed = false;


      // Header
      if (state.header && stream.match(/^#+$/, true)) {
        if (modeCfg.highlightFormatting) state.formatting = "header";
        return getType(state);
      }

      // Advance character
      var ch = stream.next();

      // Matches link titles present on next line (original comment)
      // NOTE: Never gets called? linkTitle recognition is failing? (Jul 20)
      if (state.linkTitle) {
        state.linkTitle = false;
        var matchCh = ch;
        if (ch === '(') {
          matchCh = ')';
        }
        matchCh = (matchCh + '').replace(/([.?*+^\[\]\\(){}|-])/g, "\\$1");
        var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
        if (stream.match(new RegExp(regex), true)) {
          return tokenTypes.url;
        }
      }

      // Code
      // If this block is changed, it may need to be updated in GFM mode (original comment)
      if (ch === '`') {
        var previousFormatting = state.formatting;
        if (modeCfg.highlightFormatting) state.formatting = "code";
        stream.eatWhile('`');
        var count = stream.current().length
        if (state.code == 0 && (!state.quote || count == 1)) {
          state.code = count
          return getType(state)
        } else if (count == state.code) { // Must be exact
          var t = getType(state)
          state.code = 0
          return t
        } else {
          state.formatting = previousFormatting
          return getType(state)
        }
      } else if (state.code) {
        return getType(state);
      }

      // Escape
      if (ch === '\\') {
        stream.next();
        if (modeCfg.highlightFormatting) {
          var type = getType(state);
          var formattingEscape = tokenTypes.formatting + "-escape";
          return type ? type + " " + formattingEscape : formattingEscape;
        }
      }

      // Inline footnote
      if (ch === '^' && stream.peek() === '[') {
        // Skip ahead one. This prevents link parsing from triggering.
        stream.next()
        if (modeCfg.highlightFormatting) state.formatting = "footnoteInline";
        state.footnoteInline = true
        return getType(state)
      }

      // Inline footnote: Closing
      if (ch === ']' && state.footnoteInline === true) {
        if (modeCfg.highlightFormatting) state.formatting = "footnoteInline";
        var type = getType(state);
        state.footnoteInline = false;
        return type;
      }

      // Reference footnote
      // TODO: We skip to the end of this, using stream.match, so I'm not sure how it will work with markdown character formatting...
      if (ch === '[' && stream.match(/\^\S*\]/, true)) {
        // stream.next()
        // if (modeCfg.highlightFormatting) state.formatting = "footnoteReferenceId";
        // state.footnoteReferenceId = true
        return tokenTypes.footnoteReferenceId
        // return getType(state)
      }

      // Image
      if (ch === '!' && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
        state.image = true;
        state.imageMarker = true;
        if (modeCfg.highlightFormatting) state.formatting = "image";
        return getType(state);
      }

      // Image: Alt text
      if (ch === '[' && state.imageMarker && stream.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/, false)) {
        state.imageMarker = false;
        state.imageAltText = true
        if (modeCfg.highlightFormatting) state.formatting = "image";
        return getType(state);
      }

      // Image: Closing
      if (ch === ']' && state.imageAltText) {
        if (modeCfg.highlightFormatting) state.formatting = "image";
        var type = getType(state);
        state.imageAltText = false;
        state.inline = state.f = parseLinkDestination;
        return type;
      }

      // Citation
      // Demo: https://regex101.com/r/05VZEh/1
      // if (ch === '[' && stream.peek() === '@') {
      // if (ch === '[' && stream.match(/^@.*?\]/, true)) {
      if (ch === '[' && stream.match(/^@.*?\](?!\()/, true)) {
        return tokenTypes.citation
        // if (modeCfg.highlightFormatting) state.formatting = "citation";
        // state.citation = true
        // if (modeCfg.highlightFormatting) state.formatting = "citation";
        // state.citation = true
        // return getType(state)
      }

      // Citation: Closing `]`
      // if (ch === ']' && state.citation === true) {
      //   if (modeCfg.highlightFormatting) state.formatting = "citation";
      //   var type = getType(state);  
      //   state.citation = false;
      //   state.f = state.inline = inlineNormal;
      //   return type;
      // }

      // console.trace(state)
      // Link: Opening `[`
      if (ch === '[' && !state.image && !state.link) {

        if (stream.match(/[^\]]+?\]\(.*?\)/, false)) {

          // Inline link: Start of text
          // E.g. `[text](url "title") `
          //       ^
          state.link = true;
          state.linkInline = true;
          state.linkText = true;

        } else if (stream.match(linkRefDefintionRE, false)) {

          // Reference link definition. Start of label
          // E.g. `[label]: url "title"`
          //       ^
          // state.link = true;
          // state.linkReference = true
          // state.linkLabel = true

        } else if (stream.match(linkRefFullOrCollapsedRE, false)) {

          // Reference link (full or collapsed): Start of text
          // E.g. `[text][label]` or `[text][]`
          //       ^                  ^
          state.link = true;
          state.linkReference = true
          state.linkText = true;

        } else if (stream.match(/[^\]]+?\](?!\[|\() /, false)) {

          // Reference link (shortcut): Start of label
          // E.g. `[label]`
          //       ^
          state.link = true;
          state.linkReference = true
          state.linkLabel = true;
        }

        if (state.link && modeCfg.highlightFormatting) state.formatting = "link";
        return getType(state);
      }

      // Link: `]`
      if (ch === ']' && state.link) {

        if (modeCfg.highlightFormatting) state.formatting = "link";
        var type = getType(state); // Should return `link`

        if (state.linkInline && state.linkText && stream.match(/\(.*?\)/, false)) {

          // Inline link: End of text, start of destination
          // E.g. `[text](url "title")`
          //            ^
          state.linkText = false
          state.inline = state.f = parseLinkDestination

        } else if (state.linkReference) {

          if (state.linkText && stream.peek() === '[') {

            // Reference link (full or collapsed): End of text, start of label.
            // E.g. `[text][label]` or `[text][]`
            //            ^                  ^
            state.linkText = false
            state.linkLabel = true

          } else if (state.linkLabel) {

            if (stream.match(/: /, false)) {

              // Reference link definition: End of label, start of destination.
              // E.g. `[label]: url "title"`
              //             ^
              stream.next()
              state.linkLabel = false
              state.linkReference = false
              state.link = false;
              // state.inline = state.f = parseLinkDestination

            } else if (stream.peek() !== ':') {

              // Reference link (all types): End of label, and of link
              // E.g. `[text][label]`, `[text][]`, `[label]`
              //                   ^           ^          ^
              state.linkLabel = false
              state.linkReference = false
              state.link = false;
              // state.inline = state.f = inlineNormal

            }

            // state.inline = state.f = stream.match(/\(.*?\)| ?\[.*?\]/, false) ? parseLinkDestination : inlineNormal // We hand over to parseLinkDestination
          }
        }

        return type;
      }




      // Autolink URL
      if (ch === '<' && stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, false)) {

        // if (modeCfg.highlightFormatting) state.formatting = "link";
        stream.match(/^[^>]+/, true);
        stream.next() // Make sure to include the closing `>`
        return tokenTypes.autolinkUrl;

        // state.f = state.inline = autolink;
        // if (modeCfg.highlightFormatting) state.formatting = "link";
        // var type = getType(state);
        // if (type) {
        //   type += " ";
        // } else {
        //   type = "";
        // }
        // return type + tokenTypes.autolinkUrl;
      }

      // Autolink Email
      if (ch === '<' && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, false)) {

        // if (modeCfg.highlightFormatting) state.formatting = "link";
        stream.match(/^[^>]+/, true);
        stream.next() // Make sure to include the closing `>`
        return tokenTypes.autolinkEmail;

        // state.f = state.inline = autolink;
        // if (modeCfg.highlightFormatting) state.formatting = "link";
        // var type = getType(state);
        // if (type) {
        //   type += " ";
        // } else {
        //   type = "";
        // }
        // return type + tokenTypes.autolinkEmail;
      }
         
      // Multi-line XML
      // Demo: https://regex101.com/r/3d252R/2/
      // Original if statement: 
      // if (modeCfg.xml && ch === '<' && !state.link && stream.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>|$))/i, false)) {
      if (modeCfg.xml && ch === '<' && !state.link && stream.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=(?:"\s*[^>"]+"|'\s*[^>']+'))?)*\s*(?:>|$)).*?<\//i, false)) {
        var end = stream.string.indexOf(">", stream.pos);
        if (end != -1) {
          var atts = stream.string.substring(stream.start, end);
          if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) state.md_inside = true;
        }
        stream.backUp(1);
        state.htmlState = CodeMirror.startState(htmlMode);
        return switchBlock(stream, state, htmlBlock);
      }

      // Individual XML tags (anything not caught by multi-line check, above)
      // Multi-line tags -not- caught.
      // CommonMark: Raw HTML: https://spec.commonmark.org/0.29/#raw-html
      // Demo: https://regex101.com/r/XYkJkx/3
      // Generally good support. Some illegal cases not caught.
      // Minor problem: Styles multiple consecutive tags as one single span.
      if (modeCfg.xml && ch === '<' && (
        stream.match(/^(?!\d*>|__)([^\s]|[^\s[][^!>/]*?)(?:>|\/>)/)
      )) {
        state.md_inside = false;
        return "tag";
      }

      if (ch === "*" || ch === "_") {
        var len = 1, before = stream.pos == 1 ? " " : stream.string.charAt(stream.pos - 2)
        while (len < 3 && stream.eat(ch)) len++
        var after = stream.peek() || " "
        // See http://spec.commonmark.org/0.27/#emphasis-and-strong-emphasis
        var leftFlanking = !/\s/.test(after) && (!punctuation.test(after) || /\s/.test(before) || punctuation.test(before))
        var rightFlanking = !/\s/.test(before) && (!punctuation.test(before) || /\s/.test(after) || punctuation.test(after))
        var setEm = null, setStrong = null
        if (len % 2) { // Em
          if (!state.em && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
            setEm = true
          else if (state.em == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
            setEm = false
        }
        if (len > 1) { // Strong
          if (!state.strong && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before)))
            setStrong = true
          else if (state.strong == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after)))
            setStrong = false
        }
        if (setStrong != null || setEm != null) {
          if (modeCfg.highlightFormatting) state.formatting = setEm == null ? "strong" : setStrong == null ? "em" : "strong em"
          if (setEm === true) state.em = ch
          if (setStrong === true) state.strong = ch
          var t = getType(state)
          if (setEm === false) state.em = false
          if (setStrong === false) state.strong = false
          return t
        }
      } else if (ch === ' ') {
        if (stream.eat('*') || stream.eat('_')) { // Probably surrounded by spaces
          if (stream.peek() === ' ') { // Surrounded by spaces, ignore
            return getType(state);
          } else { // Not surrounded by spaces, back up pointer
            stream.backUp(1);
          }
        }
      }

      // Strikethrough
      if (modeCfg.strikethrough) {
        if (ch === '~' && stream.eatWhile(ch)) {
          if (state.strikethrough) {// Remove strikethrough
            if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
            var t = getType(state);
            state.strikethrough = false;
            return t;
          } else if (stream.match(/^[^\s]/, false)) {// Add strikethrough
            state.strikethrough = true;
            if (modeCfg.highlightFormatting) state.formatting = "strikethrough";
            return getType(state);
          }
        } else if (ch === ' ') {
          if (stream.match(/^~~/, true)) { // Probably surrounded by space
            if (stream.peek() === ' ') { // Surrounded by spaces, ignore
              return getType(state);
            } else { // Not surrounded by spaces, back up pointer
              stream.backUp(2);
            }
          }
        }
      }

      // Emoji
      if (modeCfg.emoji && ch === ":" && stream.match(/^(?:[a-z_\d+][a-z_\d+-]*|\-[a-z_\d+][a-z_\d+-]*):/)) {
        state.emoji = true;
        if (modeCfg.highlightFormatting) state.formatting = "emoji";
        var retType = getType(state);
        state.emoji = false;
        return retType;
      }

      // Space
      if (ch === ' ') {
        if (stream.match(/^ +$/, false)) {
          state.trailingSpace++;
        } else if (state.trailingSpace) {
          state.trailingSpaceNewLine = true;
        }
      }

      return getType(state);
    }

    // TODO: Rename to autolinks, per commmonmark spec?
    // Handle autolinks
    // E.g. <http://foo.bar.baz>
    // See: https://spec.commonmark.org/0.29/#autolink
    // function autolink(stream, state) {
    //   var ch = stream.next();

    //   if (ch === ">") {
    //     state.f = state.inline = inlineNormal;
    //     if (modeCfg.highlightFormatting) state.formatting = "link";
    //     var type = getType(state);
    //     if (type) {
    //       type += " ";
    //     } else {
    //       type = "";
    //     }
    //     return type + tokenTypes.autolinkUrl;
    //   }

    //   stream.match(/^[^>]+/, true);

    //   return tokenTypes.autolinkUrl;
    // }

    // Demo: https://regex101.com/r/anM7bj/1/
    // TODO: Improve to filter out erroneous titles (e.g. line breaks?)
    var linkWithTitleRE = /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.))*?(?=\s(".*?")|\s('.*?')|\s(\(.*?\)))/
    var linkRE = /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\)|])/


    function parseLinkDestination(stream, state) {

      // Check if space, and return NULL if so (to avoid marking the space)
      // if (stream.eatSpace()) return null;

      var ch = stream.next();

      // Start
      if (ch === '(') {

        // Start states
        state.linkUrl = true;
        if (modeCfg.highlightFormatting) state.formatting = "link-string";

        // Is there a title? If yes, jump to it and set `state.linkTitle` true.
        // Else, jump to closing ')'
        if (stream.match(linkWithTitleRE)) {
          var returnState = getType(state)
          state.linkUrl = false;
          state.linkTitle = true
          return returnState
        } else {
          stream.match(linkRE)
          return getType(state);
        }
      }

      // If there's a title, jump to end of it
      // Demo: https://regex101.com/r/TqWExF/1/
      if (state.linkTitle && ch !== ')') {
        stream.match(/^.*?("|'|\))(?=\))/)
        return getType(state)
      }

      // End
      if (ch === ')') {

        if (modeCfg.highlightFormatting) state.formatting = "link-string";
        var returnState = getType(state);

        // Reset to normal
        state.f = state.inline = inlineNormal;
        state.link = false
        state.image = false
        state.linkInline = false
        state.linkReference = false
        state.linkUrl = false;
        state.linkTitle = false;

        return returnState;
      }
    }

    function linkReferenceDefinition(stream, state) {

      // Label
      if (!state.link && stream.match(/^\[[^\]]+?\]:/)) {
        state.link = true
        state.linkReferenceDefinition = true
        state.linkLabel = true
        return getType(state)
      }

      // Url
      if (state.linkLabel && stream.match(linkUrlRE)) {
        state.linkLabel = false
        state.linkUrl = true
        var type = getType(state)
        if (!stream.match(linkTitleRE, false)) reset()
        return type
      }

      // Title
      if (state.linkUrl && stream.match(linkTitleRE)) {
        state.linkUrl = false
        state.linkTitle = true
        var type = getType(state)
        reset()
        return type
      }

      function reset() {
        state.f = state.inline = inlineNormal;
        state.link = false
        state.linkReferenceDefinition = false
        state.linkLabel = false
        state.linkUrl = false
        state.linkTitle = false
      }

      // Have to have this, or we get error
      stream.next();
    }


    function footnoteReferenceDefinition(stream, state) {

      if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
        state.f = footnoteLinkInside;
        stream.next(); // Consume [
        if (modeCfg.highlightFormatting) state.formatting = "link";
        state.link = true;
        state.linkReferenceDefinition = true;
        state.linkText = true;
        return getType(state);
      }
      return switchInline(stream, state, inlineNormal);
    }

    function footnoteLinkInside(stream, state) {
      if (stream.match(/^\]:/, true)) {
        state.f = state.inline = footnoteUrl;
        if (modeCfg.highlightFormatting) state.formatting = "link";
        var returnType = getType(state);
        state.linkText = false;
        return returnType;
      }

      stream.match(/^([^\]\\]|\\.)+/, true);

      return tokenTypes.linkText;
    }

    function footnoteUrl(stream, state) {
      // Check if space, and return NULL if so (to avoid marking the space)
      // if (stream.eatSpace()) {
      //   return null;
      // }
      // Match URL
      stream.match(/^[^\s]+/, true);
      // Check for link title
      if (stream.peek() === undefined) { // End of line, set flag to check next line
        state.linkTitle = true;
      } else { // More content on line, check if link title
        stream.match(/^(?:\s+(?:"(?:[^"\\]|\\\\|\\.)+"|'(?:[^'\\]|\\\\|\\.)+'|\((?:[^)\\]|\\\\|\\.)+\)))?/, true);
      }
      state.f = state.inline = inlineNormal;
      return tokenTypes.linkUrl;
    }







    var mode = {
      startState: function () {
        return {
          f: blockNormal,

          prevLine: { stream: null },
          thisLine: { stream: null },

          block: blockNormal,
          htmlState: null,
          indentation: 0,

          inline: inlineNormal,
          text: handleText,

          formatting: false,
          figure: false,

          link: false,
          linkInline: false,
          linkReference: false,
          linkReferenceDefinition: false,
          linkText: false,
          linkLabel: false,
          linkUrl: false,
          linkTitle: false,

          code: 0,
          em: false,
          strong: false,
          header: 0,
          setext: 0,
          hr: false,
          taskList: false,
          list: false,
          listType: '',
          listStack: [],
          quote: 0,
          trailingSpace: 0,
          trailingSpaceNewLine: false,
          strikethrough: false,
          emoji: false,
          fencedEndRE: null
        };
      },

      copyState: function (s) {
        return {
          f: s.f,

          prevLine: s.prevLine,
          thisLine: s.thisLine,

          block: s.block,
          htmlState: s.htmlState && CodeMirror.copyState(htmlMode, s.htmlState),
          indentation: s.indentation,

          localMode: s.localMode,
          localState: s.localMode ? CodeMirror.copyState(s.localMode, s.localState) : null,

          inline: s.inline,
          text: s.text,
          formatting: false,
          figure: false,

          link: s.link,
          linkInline: s.linkInline,
          linkReference: s.linkReference,
          linkReferenceDefinition: s.linkReferenceDefinition,
          linkText: s.linkText,
          linkLabel: s.linkLabel,
          linkUrl: s.linkUrl,
          linkTitle: s.linkTitle,

          code: s.code,
          em: s.em,
          strong: s.strong,
          strikethrough: s.strikethrough,
          emoji: s.emoji,
          header: s.header,
          setext: s.setext,
          hr: s.hr,
          taskList: s.taskList,
          list: s.list,
          listType: s.listType,
          listStack: s.listStack.slice(0),
          quote: s.quote,
          indentedCode: s.indentedCode,
          trailingSpace: s.trailingSpace,
          trailingSpaceNewLine: s.trailingSpaceNewLine,
          md_inside: s.md_inside,
          fencedEndRE: s.fencedEndRE
        };
      },

      token: function (stream, state) {

        // Reset state.formatting
        state.formatting = false;

        if (stream != state.thisLine.stream) {
          state.header = 0;
          state.hr = false;

          if (stream.match(/^\s*$/, true)) {
            blankLine(state);
            return null;
          }

          state.prevLine = state.thisLine
          state.thisLine = { stream: stream }

          // Reset state.taskList
          state.taskList = false;

          // Reset state.trailingSpace
          state.trailingSpace = 0;
          state.trailingSpaceNewLine = false;

          if (!state.localState) {
            state.f = state.block;
            if (state.f != htmlBlock) {
              var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, expandedTab).length;
              state.indentation = indentation;
              state.indentationDiff = null;
              if (indentation > 0) return null;
            }
          }
        }

        return state.f(stream, state);
      },

      innerMode: function (state) {
        if (state.block == htmlBlock) return { state: state.htmlState, mode: htmlMode };
        if (state.localState) return { state: state.localState, mode: state.localMode };
        return { state: state, mode: mode };
      },

      indent: function (state, textAfter, line) {
        if (state.block == htmlBlock && htmlMode.indent) return htmlMode.indent(state.htmlState, textAfter, line)
        if (state.localState && state.localMode.indent) return state.localMode.indent(state.localState, textAfter, line)
        return CodeMirror.Pass
      },

      blankLine: blankLine,

      getType: getType,

      blockCommentStart: "<!--",
      blockCommentEnd: "-->",
      closeBrackets: "()[]{}''\"\"``",
      fold: "markdown"
    };
    return mode;
  }, "xml");

  CodeMirror.defineMIME("text/markdown", "markdown");

  CodeMirror.defineMIME("text/x-markdown", "markdown");

});
