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
      var mode = CodeMirror.getMode(cmCfg, { name });
      return mode.name == "null" ? null : mode;
    }

    // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
    // Excess `>` will emit `error` token.
    if (modeCfg.maxBlockquoteDepth === undefined)
      modeCfg.maxBlockquoteDepth = 0;

    if (modeCfg.xml === undefined)
      modeCfg.xml = true;

    // Shared regular expressions and strings

    const atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace ? /^(#+)/ : /^(#+)(?: |$)/
    const citationRE = /^[^\[\]\(\)]*?-?@[a-z0-9_]*[a-z0-9_:.#$%&\-+?<>~/]*?.*?\](?!\()/
    const emailInBracketsRE = /^[^> \\]+@(?:[^\\>]|\\.)+>/
    const emojiRE = /^(?:[a-z_\d+][a-z_\d+-]*|\-[a-z_\d+][a-z_\d+-]*):/
    const expandedTab = "   " // CommonMark specifies tab as 4 spaces
    const fencedCodeBlockRE = /^(~~~+|```+)[ \t]*([\w+#-]*)[^\n`]*$/
    // Figure demo: https://regex101.com/r/crpIQU/1
    const figureRE = /^!((\[.*?\]\(.*?\))|(\[[^\]]+?\]\[[^\]]*?\]))\s?$/
    const footnoteInlineRE = /\[.*?\]/
    const footnoteReferenceRE = /\^\S*\]/
    const footnoteReferenceDefinitionRE = /^\[\^\S*\]: /
    const hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/

    // Changed Mar 7 2022, to allow for anything inside [...], trying to get nested links and citation keys to work inside captions.
    // const imageRE = /(\[[^\]]*?\]\(.*?\))|(\[[^\]]+?\]\[[^\]]*?\])/ // Inline or Reference
    const imageRE = /(\[.*?\]\(.*?\))|(\[[^\]]+?\]\[[^\]]*?\])/ // Inline or Reference

    // Changed Mar 7 2022: Same as above
    // const linkInlineRE = /[^\]]*?\]\(.*?\)/
    const linkInlineRE = /.*?\]\(.*?\)/
    const linkReferenceDefinitionRE = /^\[[^\]]+?\]:\s*(?:<[^<>\n]*>|(?!<)[^\s]+)/
    const linkReferenceFullRE = /[^\]]+?\]\[[^\]]+\]/
    const linkReferenceCollapsedRE = /[^\]]+?\]\[\]/
    const linkReferenceShortcutRE = /[^\]@]+?\](?!\[|\()/
    const listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/
    const textRE = /^[^#!\[\]*_\\<>^` "'(~:$]+/
    const taskListRE = /^\[(x| )\](?=\s)/i
    const texMathRE = /^\$\$$/
    const urlInBracketsRE = /^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/

    const punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/

    const urlRE = /^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i

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

    /**
     * Called by parent mode when empty line is detected.
     * And by token function at start of new line, if 
     * the line contains only whitespace.
     * @param {*} state 
     * @returns 
     */
    function blankLine(state) {

      // Reset link states
      state.link = false;
      state.linkReferenceDefinition = false;
      state.linkLabel = false;
      state.linkTitle = false;
      state.linkUrl = false;
      state.linkText = false;

      state.em = false;
      state.strong = false;
      state.strikethrough = false;
      state.quote = 0;
      state.indentedCode = false;

      // If htmlBlock, check if we should exit.
      if (state.f == htmlBlock) {
        var inner = CodeMirror.innerMode(htmlMode, state.htmlState)
        var exitCondition =
          inner.mode.name == "xml" &&
          inner.state.tagStart === null &&
          (!inner.state.context && inner.state.tokenize.isInText)
        if (exitCondition) {
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

      if (state.fencedcodeblock) {
        return 'line-fencedcodeblock'
      } else if (state.f == htmlBlock) {
        return 'line-htmlBlock'
      } else {
        return null;
      }
    }

    function blockNormal(stream, state) {

      var firstTokenOnLine = stream.column() === state.indentation;
      var prevLineLineIsEmpty = lineIsEmpty(state.prevLine.stream);
      var prevLineIsIndentedCode = state.indentedCode;
      var prevLineIsHr = state.prevLine.hr;
      var prevLineIsList = state.list !== false;
      var maxNonCodeIndentation = (state.listStack[state.listStack.length - 1] || 0) + 3;

      // Footnote reference definition:
      // If it's active (would have been turned on on previous line),
      // continue it, if this line is indendent. Else, discontinue.
      // TODO: 3/24/2021: Re-enable multi-line footnote reference definitions in future.
      // if (state.footnoteReferenceDefinition) {
      //   if (!state.indentation) {
      //     state.footnoteReferenceDefinition = false
      //   }
      // }

      // Reset
      state.linkReferenceDefinition = false
      state.footnoteReferenceDefinition = false
      state.figure = false
      state.code = 0
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
              state.taskList = false;
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

        // ----- Indented code (?) ----- //
        stream.skipToEnd();
        state.indentedCode = true;
        return 'code';

      } else if (stream.eatSpace()) {

        // ----- Spaces (?) ----- //
        // I don't think this is ever called... 
        // Because token function 
        return null;

      } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(atxHeaderRE)) && match[1].length <= 6) {

        // -----  Header ----- //
        state.quote = 0;
        state.header = match[1].length;
        state.thisLine.header = true;
        state.formatting = 'header-start';
        state.f = state.inline;
        return getStyles(state);

      } else if (state.indentation <= maxNonCodeIndentation && stream.eat('>')) {

        // -----  Block quote ----- //
        state.quote = firstTokenOnLine ? 1 : state.quote + 1;
        state.formatting = 'quote-start'
        stream.eatSpace();
        return getStyles(state);

      } else if (!isHr && !state.setext && firstTokenOnLine && stream.match(footnoteReferenceDefinitionRE, false)) {

        // ----- Footnote: Reference definition ----- //
        state.footnoteReferenceDefinition = true
        state.f = state.inline;
        return getStyles(state);

      } else if (!isHr && !state.setext && stream.column() <= 3 && stream.match(linkReferenceDefinitionRE, false)) {

        // ----- Link: Reference definition ----- //
        // Regexp demo: https://regex101.com/r/6nSTuL/6/
        return switchInline(stream, state, linkReferenceDefinition);

      } else if (modeCfg.implicitFigures && !isHr && !state.setext && firstTokenOnLine && stream.match(figureRE, false)) {

        // ----- Figure ----- //
        state.figure = true
        state.formatting = true
        state.f = state.inline;
        return getStyles(state);

      } else if (!isHr && !state.setext && firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(listRE))) {

        // ----- List ----- //
        state.list = match[1] ? "ol" : "ul";
        state.indentation = lineIndentation + stream.current().length;
        state.quote = 0;

        // Add this list item's content's indentation to the stack
        state.listStack.push(state.indentation);

        // Reset inline styles which shouldn't propagate aross list items
        state.em = false;
        state.strong = false;
        state.code = false;
        state.strikethrough = false;

        // Check if task list. If true, check if item is "open" `[ ]` or "closed" `[x]`
        if (stream.match(taskListRE, false)) {
          state.taskList = true
        }

        state.formatting = 'list-marker'

        return getStyles(state);

      } else if (firstTokenOnLine && !state.texMathDisplay && (match = stream.match(texMathRE, true))) {

        // ----- TeX math: Display ----- //

        // Docs: https://pandoc.org/MANUAL.html#math

        // TODO: Add an option here, to enable support only if user has `modeCfg.texMath` true or some such. See `Fenced code block` section below for example of how to format that.

        state.localMode = getMode('stex');

        if (state.localMode) state.localState = CodeMirror.startState(state.localMode);

        state.f = state.block = local;

        state.texMathDisplay = true
        state.formatting = 'line-texmath-display-start'
        state.code = -1

        return getStyles(state);


      } else if (firstTokenOnLine && state.indentation <= maxNonCodeIndentation && (match = stream.match(fencedCodeBlockRE, true))) {

        // ----- Fenced code block ----- //

        state.quote = 0;

        // Define the end of the fenced code block we're going to look for,
        // based on the start (`match[1]`).
        state.fencedEndRE = new RegExp(match[1] + "+ *$");

        // Try switching modes:

        // First, get the _name_ of the mode we want to use:
        // `match[2]` is the characters following the opening 3 characters
        // The CommonMark spec calls this the "info string".
        // This string specifies the intended format of the code block.
        // E.g. ```html or ```js
        var infoString = match[2]

        // Next, get the mode.
        // If infoString is blank, we use JS mode.
        // Else, if infoString is valid mode name (meaning it matches one of names 
        // enumerated in meta.js, and is loaded by index.html), we get the mode 
        // from `getMode`.
        // Else, if infoString is NOT a valid mode name, we get back `null` from
        // getMode, which results in the fenced code block contents being styled
        // as plain text.

        state.localMode = infoString ? getMode(infoString) : getMode('js')
        if (state.localMode) state.localState = CodeMirror.startState(state.localMode)

        state.f = state.block = local

        state.fencedcodeblock = true
        state.formatting = 'line-fencedcodeblock-firstLine'
        state.code = -1

        return getStyles(state)

      } else if (

        // SETEXT has lowest block-scope precedence after HR, so check it after
        //  the others (code, blockquote, list...)

        // if setext set, indicates line after ---/===
        // ORIGINAL COMMENT re: regexp: "naive link-definition"
        state.setext || (
          // line before ---/===
          (!allowsInlineContinuation || !prevLineIsList) && !state.quote && state.list === false &&
          !state.code && !isHr && !/^\s*\[[^\]]+?\]:.*$/.test(stream.string) &&
          (match = stream.lookAhead(1)) && (match = match.match(/^ {0,3}(?:\={1,}|-{2,})\s*$/))
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
          state.formatting = true
        }
        state.thisLine.header = true;
        state.f = state.inline;
        return getStyles(state);

      } else if (isHr) {

        // ----- HR ----- //
        stream.skipToEnd();
        state.thisLine.hr = true;
        return 'line-hr hr';
      }

      // No block-level elements found. Proceed with inline processing...
      return switchInline(stream, state, state.inline);
    }

    /**
     * Called when inlineNormal detects xml tags, and switches
     * mode to htmlBlock.
     * @param {*} stream 
     * @param {*} state 
     * @returns 
     */
    function htmlBlock(stream, state) {

      var inner = CodeMirror.innerMode(htmlMode, state.htmlState)

      var style = htmlMode.token(stream, state.htmlState);

      // Designate as html block (as opposed to inline html),
      // if 1) this is the start of the html, and 2) it's the 
      // first character of the line.
      if (state.htmlState.isStart && stream.column() == 0) {
        inner.state.isBlock = true
        style += ' line-htmlBlock-firstLine'
      }

      // Reset `isStart` state to false
      if (state.htmlState.isStart) state.htmlState.isStart = false

      // Add `htmlBlock` line style
      if (inner.state.isBlock) {
        style += ' line-htmlBlock'
      }

      // console.log('-------')
      // console.log(inner.state.tagStart)
      // console.log(stream.string, stream.current())
      // console.log(stream)
      // console.log(inner)
      // console.log(inner.mode.xmlCurrentContext(inner.state))
      // console.log(inner.mode.xmlCurrentTag(inner.state))

      // If exit conditions are met, exit.

      // `inner.state.tagStart`: Index on stream.string of the current tag's
      // opening "<" character. Is null if token is NEITHER the 
      // opening "<" character or the tag name (e.g. "div", "span").

      // `inner.state.context`: Context is an object with details about token's
      // parents. `tagName` prop is name of most recent parent. E.g. "div", "b"
      // If there is no .context, we're outside the closing tag.

      // `inner.state.tokenize.isInText`: Is falsey when token is an opening `<`
      // or tag's name (e.g. "div"). Is true the rest of the time (e.g. when 
      // in plain text.)

      // We're at the closing tag's `>` character.
      const exitConditionA =
        inner.mode.name == "xml" &&
        inner.state.tagStart === null &&
        (!inner.state.context && inner.state.tokenize.isInText)

      // Catch the following scenario:
      // --------------
      // <div>
      //   Open tag <b
      // </div>
      // --------------
      // The bold tag is left open. This causes exitConditionA to
      // not trigger on </div>, because </div> gets processed as 
      // plain text, and the html block to therefore never close. 
      // Everything in the subsequent doc gets styled as html. 

      // We check for this scenario by checking if the current 
      // token matches an expected closing tag (e.g. "</div>"
      // within context.tagName of "div"), but it recognized
      // as plain text (inner.state.tokenize.isInText).
      const exitConditionB =
        inner.mode.name == "xml" &&
        inner.state.tagStart === null &&
        inner.state.context &&
        stream.current() == `</${inner.state.context.tagName}>` &&
        inner.state.tokenize.isInText

      // NOTE: Disabled, because we're not using markdown inside feature.
      // const exitConditionB =
      //   state.md_inside &&
      //   stream.current().indexOf(">") > -1

      if (exitConditionA || exitConditionB) {
        // Add `htmlBlock-lastLine` line style.
        if (inner.state.isBlock) style += ' line-htmlBlock-lastLine htmlBlock-closing-bracket'
        // Reset 
        state.f = inlineNormal;
        state.block = blockNormal;
        state.htmlState = null;
      }

      // Simplified alternative for determine when to exit HTML:
      // Exit on every `>`.
      // if (stream.current().indexOf(">") > -1) {
      //   state.f = inlineNormal;
      //   state.block = blockNormal;
      //   state.htmlState = null;
      // }

      return style
    }

    /**
     * 
     * @param {*} stream 
     * @param {*} state 
     */
    function local(stream, state) {

      var currListInd = state.listStack[state.listStack.length - 1] || 0;
      var hasExitedList = state.indentation < currListInd;
      var maxFencedEndInd = currListInd + 3;

      if (state.texMathDisplay && stream.match(texMathRE)) {

        // We've reached end of TeXMath display block.
        // Docs: https://pandoc.org/MANUAL.html#math

        state.formatting = 'line-texmath-display-end'
        var styles = getStyles(state)
        state.texMathDisplay = false
        state.localMode = null
        state.f = state.block = blockNormal;
        return styles

      } else if (state.fencedEndRE && state.indentation <= maxFencedEndInd && (hasExitedList || stream.match(state.fencedEndRE))) {

        // We've reached the end of a fenced code block
        state.formatting = 'line-fencedcodeblock-lastLine'
        var styles;
        if (!hasExitedList) styles = getStyles(state)
        state.fencedcodeblock = false
        state.localMode = state.localState = null;
        state.block = blockNormal;
        state.f = inlineNormal;
        state.fencedEndRE = null;
        state.code = 0
        state.thisLine.fencedCodeEnd = true;
        if (hasExitedList) return switchBlock(stream, state, state.block);
        return styles;

      } else if (state.localMode) {

        // Another mode is handling parsing. Probably inside a
        // fenced code block. We add a matching line style.
        let token = state.localMode.token(stream, state.localState);

        if (state.fencedcodeblock) {
          token = `${token} line-fencedcodeblock`
        } else if (state.texMathDisplay) {
          token = `${token} line-texmath-display`
        }

        return token

      } else {

        // Not sure when this is triggered...
        stream.skipToEnd();
        if (state.fencedcodeblock) {
          return 'line-fencedcodeblock'
        } else {
          return 'code';
        }
      }
    }

    function getStyles(state) {
      var styles = [];

      if (state.footnoteReferenceDefinition) styles.push('line-footnote-reference-definition')
      if (state.footnoteReferenceDefinitionContent) styles.push('content')
      if (state.footnoteLabel) styles.push('label')

      if (state.footnote) {
        styles.push('footnote');
        if (state.footnoteInline) styles.push('inline');
        if (state.footnoteReference) styles.push('reference');
        if (state.footnoteLabel) { styles.push('label'); }
        if (state.footnoteContent) { styles.push('content'); }
      }

      if (state.figure) styles.push('line-figure', 'figure');

      if (state.image) styles.push('image');

      if (state.linkReferenceDefinition) styles.push('line-link-reference-definition')

      if (state.link) {
        styles.push('link')
        if (state.linkInline) styles.push('inline')
      }

      if (state.figure || state.link || state.image || state.linkReferenceDefinition) {
        if (state.linkText) styles.push('text')
        if (state.linkTitle) styles.push('title')
        if (state.linkUrl) styles.push('url')
        if (state.linkLabel) styles.push('label')
      }

      if (state.linkReference) {
        if (state.linkReference) styles.push('reference')
        if (state.referenceStyleFull) styles.push('full')
        if (state.referenceStyleCollapsed) styles.push('collapsed')
        if (state.referenceStyleShortcut) styles.push('shortcut')
      }

      // Other
      if (state.bareUrl) { styles.push('bare-url'); }
      if (state.citation) styles.push('citation')
      if (state.citationKey) styles.push('key')
      if (state.code >= 1) styles.push('code')
      if (state.em) styles.push('emphasis')
      if (state.emailInBrackets) styles.push('email-in-brackets')
      if (state.emoji) styles.push('emoji')
      if (state.fencedcodeblock) styles.push('line-fencedcodeblock')
      if (state.header) styles.push('line-header', "line-h" + state.header)
      if (state.incomplete) styles.push('incomplete')
      if (state.strikethrough) styles.push('strikethrough')
      if (state.strong) styles.push("strong")
      if (state.texMathDisplay) styles.push('line-texmath-display')
      if (state.texMathInline) styles.push('texmath-inline')
      if (state.urlInBrackets) styles.push('url-in-brackets')


      // Block quote
      if (state.quote) {
        styles.push('line-quote');

        // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
        if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
          styles.push('line-quote' + "-" + state.quote);
        } else {
          styles.push('line-quote' + "-" + modeCfg.maxBlockquoteDepth);
        }
      }

      // List
      if (state.list !== false && state.list !== null) {

        // Set type from list. Will be `ol` or `ul`.
        styles.push(`line-${state.list}`)

        // Set depth
        var listMod = state.listStack.length - 1;
        switch (listMod) {
          case 0:
            styles.push('line-list-1');
            break;
          case 1:
            styles.push('line-list-2');
            break;
          case 2:
            styles.push('line-list-3');
            break;
          case 3:
            styles.push('line-list-4');
            break;
          case 4:
            styles.push('line-list-5');
            break;
          case 5:
            styles.push('line-list-6');
            break;
        }

        // Set task list
        if (state.taskList) styles.push('line-taskList')
        if (state.taskOpen) styles.push('task task-open')
        if (state.taskClosed) styles.push('task task-closed')

      }

      // Josh 2/19/2021: Commented out these styles, as we don't need them in the editor
      // Josh 5/6/2021: I believe they allow us to style trailing spaces. 
      // Per: https://stackoverflow.com/questions/15806062/can-codemirror-show-markdown-line-breaks

      // if (state.trailingSpaceNewLine) {
      //   styles.push("trailing-space-new-line");
      // } else if (state.trailingSpace) {
      //   styles.push("trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"));
      // }

      // Add 'md' class.
      // If state.formatting is a string, add the string. 
      // E.g. `citation-start`
      if (state.formatting) {

        if (typeof state.formatting === "string") {
          styles.push(state.formatting) // 
        }

        styles.push('md');

        // TODO: Not sure what this was doing.
        // if (typeof state.formatting === "string") state.formatting = [state.formatting];

        // for (var i = 0; i < state.formatting.length; i++) {
        //   styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

        //   if (state.formatting[i] === "header") {
        //     styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.header);
        //   }

        //   // Add `formatting-quote` and `formatting-quote-#` for blockquotes
        //   // Add `error` instead if the maximum blockquote nesting depth is passed
        //   if (state.formatting[i] === "quote") {
        //     if (!modeCfg.maxBlockquoteDepth || modeCfg.maxBlockquoteDepth >= state.quote) {
        //       styles.push(tokenTypes.formatting + "-" + state.formatting[i] + "-" + state.quote);
        //     } else {
        //       styles.push("error");
        //     }
        //   }
        // }
      }

      return styles.length ? styles.join(' ') : null;
    }

    /**
     * Advance stream through plain text characters.
     * If stream is at a markdown character, return `undefined`.
     * @param {*} stream 
     * @param {*} state 
     */
    function handleText(stream, state) {

      // If we want to check for bare urls, this is the place to do it.
      // Otherwise comment this out, and use the simpler version below.

      if (stream.match(textRE, false)) {

        if (state.urlInBrackets) {
          // Advance past URL inside brackets
          stream.match(/[^>]+/, true)
          return getStyles(state)
        }

        // Automatic links (aka bare urls)
        // This is an odd place to find and flag these, but I couldn't figure out how to make it work in inlineNormal. The code is adapted from GitHub-Flavored mode: https://github.com/codemirror/CodeMirror/blob/master/mode/gfm/gfm.js#L99
        const isBareUrl = !state.link && !state.image && !state.urlInBrackets && !state.emailInBrackets && !state.linkReferenceDefinition && stream.match(urlRE)

        if (isBareUrl) {
          state.bareUrl = true
          var styles = getStyles(state)
          state.bareUrl = false
          return styles
        }

        // If none of the above, advance past the plain text.
        stream.match(textRE)
        return getStyles(state);
      }

      // if (stream.match(textRE, true)) {
      //   return getStyles(state);
      // }

      return undefined;
    }

    /**
     * Inline Normal: Parse stream.string. Catches punctuation characters only?
     * @param {*} stream 
     * @param {*} state 
     */
    function inlineNormal(stream, state) {

      // Advanced stream past plain text characters:

      // If state.text returns "undefined", the stream contains a
      // a markdown character such as "[" or "*" (also spaces), which
      // we'll process below, in the rest of inlineNormal()..

      // Else, if it returns a style, it contained plain text, 
      // which it's advanced the stream past, and we want to exit
      // inlineNormal and return that plain text style.

      // console.log("----")
      // console.log(stream.column(), stream.current())
      // console.log(stream.match(textRE, false))
      const style = state.text(stream, state)
      const advancedPastPlainText = typeof style !== 'undefined';
      if (advancedPastPlainText) {
        // console.log(stream.current())
        // console.log('/exit', style)
        // Plain text characters found. Exit early.
        return style
      }

      if (state.taskList && stream.match(/^\[/i)) {
        state.taskClosed = stream.peek() == 'x'
        state.taskOpen = !state.taskClosed
        stream.match(/^(?:x| )\]\s*/, true)
        var styles = getStyles(state)
        state.taskList = false
        state.taskClosed = false
        state.taskOpen = false
        state.list = null;

        // 4/8/2021: Commented this out here, and instead we set false
        // when we also set state.list false, so that whole line gets
        // state.taskList = true, and not just a few inline characters.
        // Important becausee we want to check state.taskList in 
        // Codemirror while doing layout (etc).
        // state.taskList = false 
        return styles
      }

      // List
      if (state.list) { // List marker (*, +, -, 1., etc)
        state.list = null;
        return getStyles(state);
      }

      // Header. Starting `###` characters.
      if (state.header && stream.match(/^#+$/, true)) {
        state.formatting = true
        return getStyles(state);
      }

      // Advance character
      var ch = stream.next();

      // Matches link titles present on next line (original comment)
      // NOTE: Never gets called? linkTitle recognition is failing? (Jul 20)
      // if (state.linkTitle) {
      //   state.linkTitle = false;
      //   var matchCh = ch;
      //   if (ch === '(') {
      //     matchCh = ')';
      //   }
      //   matchCh = (matchCh + '').replace(/([.?*+^\[\]\\(){}|-])/g, "\\$1");
      //   var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
      //   if (stream.match(new RegExp(regex), true)) {
      //     return tokenTypes.url;
      //   }
      // }

      // URL-in-brackets
      // E.g. `<http://google.com>`
      if (ch === '<' && stream.match(urlInBracketsRE, false)) {
        state.urlInBrackets = true
        state.formatting = 'url-in-brackets-start'
        return getStyles(state);
      }

      if (state.urlInBrackets && ch == '>') {
        state.formatting = 'url-in-brackets-end'
        var styles = getStyles(state)
        state.formatting = false
        state.urlInBrackets = false
        return styles
      }


      // Autolink-in-brackets Email
      // E.g. `<steve@apple.com>`
      if (ch === '<' && stream.match(emailInBracketsRE, false)) {
        state.emailInBrackets = true
        state.formatting = 'email-in-brackets-start'
        return getStyles(state);
      }

      if (state.emailInBrackets && ch == '>') {
        state.formatting = 'email-in-brackets-end'
        var styles = getStyles(state)
        state.formatting = false
        state.emailInBrackets = false
        return styles
      }


      // Citation
      // Demo: https://regex101.com/r/Pv10hL/2
      if (ch === '[' && stream.match(citationRE, false)) {
        // stream.backUp(1);
        state.formatting = 'citation-start';
        state.citation = true;
        var styles = getStyles(state)
        state.inline = state.f = citation
        return styles
      }

      // Code (span)
      // Code spans open with 1 or more backtick (`) characters. For example, the following are valid: `test`, ``test``, and ```test```. Per: https://spec.commonmark.org/0.29/#code-spans. To be valid, there must be an equal number of opening and closing backticks. The code below 1) counts how many opening backticks there are, 2) tests whether the string ahead a matching set of backticks (a valid closing set), 3) if yes, saves the count to `state.code` (which in turn tells getType to apply the `code` style), and 4) finds the closing backtick set, whereupon it clears `state.code` back to 0.
      if (ch === '`') {

        stream.eatWhile('`')
        var count = stream.current().length

        // Opening backtick set
        if (state.code == 0 && count >= 1) {

          // Test that the string ahead has at least one backtick.
          // Generate a string with the matching set of backticks
          // Then a RegEx with that string
          // Then use that RegExp in `match` to find a match.
          // If there's a match, start the code span.
          var backticks = '`'.repeat(count)
          var re = new RegExp(backticks, "g")
          if (stream.match(re, false)) {
            state.code = count
            state.formatting = 'code-start'
            return getStyles(state)
          }
        } else if (state.code >= 1 && count == state.code) {
          // Closing backtick set
          state.formatting = 'code-end'
          var styles = getStyles(state)
          state.code = 0
          return styles
        }
      } else if (state.code) {
        return getStyles(state)
      }

      // if (state.code >= 1) {
      //   if (ch !== '`') {
      //     // Jump to end of the code span
      //     // Demo: https://regex101.com/r/o43CjK/2
      //     stream.match(/[^\n]+(?=`)/)
      //     return getType(state)
      //   } else {
      //     state.formatting = true
      //     stream.match(/`+/)
      //     var type = getType(state)
      //     state.code = 0
      //     return type
      //   }
      // }

      // Emoji
      if (modeCfg.emoji && ch === ":" && stream.match(emojiRE)) {
        state.emoji = true;
        state.formatting = true
        var retType = getStyles(state);
        state.emoji = false;
        return retType;
      }

      // Emphasis and Strong emphasis (aka: italic and bold)
      // NOTE: This is mostly-unmodified original code.
      // I've added start and end 
      // https://github.com/codemirror/CodeMirror/blob/master/mode/markdown/markdown.js#L563
      if (ch === "*" || ch === "_") {
        var len = 1
        var before = stream.pos == 1 ? " " : stream.string.charAt(stream.pos - 2)
        while (len < 2 && stream.eat(ch)) len++
        var after = stream.peek() || " "
        // See http://spec.commonmark.org/0.27/#emphasis-and-strong-emphasis
        var leftFlanking = !/\s/.test(after) && (!punctuation.test(after) || /\s/.test(before) || punctuation.test(before))
        var rightFlanking = !/\s/.test(before) && (!punctuation.test(before) || /\s/.test(after) || punctuation.test(after))
        var setEm = null, setStrong = null
        if (len % 2) { // Em
          if (!state.em && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before))) {
            state.formatting = 'emphasis-start'
            setEm = true
          } else if (state.em == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after))) {
            state.formatting = 'emphasis-end'
            setEm = false
          }
        }
        if (len > 1) { // Strong
          if (!state.strong && leftFlanking && (ch === "*" || !rightFlanking || punctuation.test(before))) {
            state.formatting = 'strong-start'
            setStrong = true
          } else if (state.strong == ch && rightFlanking && (ch === "*" || !leftFlanking || punctuation.test(after))) {
            state.formatting = 'strong-end'
            setStrong = false
          }
        }
        if (setStrong != null || setEm != null) {
          if (setEm === true) state.em = ch
          if (setStrong === true) state.strong = ch
          var t = getStyles(state)
          if (setEm === false) state.em = false
          if (setStrong === false) state.strong = false
          return t
        }
      } else if (ch === ' ') {
        if (stream.eat('*') || stream.eat('_')) { // Probably surrounded by spaces
          if (stream.peek() === ' ') { // Surrounded by spaces, ignore
            return getStyles(state);
          } else { // Not surrounded by spaces, back up pointer
            stream.backUp(1);
          }
        }
      }

      // Escape
      // NOTE 9/10/2020: Am not sure what this does, exactly.
      if (ch === '\\') {
        stream.next();
        var styles = getStyles(state);
        var formattingEscape = 'md' + "-escape";
        return styles ? styles + " " + formattingEscape : formattingEscape;
      }

      // Footnote (inline)
      if (ch === '^' && stream.match(footnoteInlineRE, false)) {

        // If brackets do not contain at least one non-whitespace 
        // character, mark incomplete.
        if (!stream.match(/\[[^\]]+?\]/, false)) {
          state.incomplete = true
        }

        // Skip ahead one. This prevents link parsing from triggering.
        stream.next() // So we get the `[` in the opening `^[`
        state.formatting = 'footnote-inline-start';
        state.footnote = true
        state.footnoteInline = true

        var styles = getStyles(state)
        if (!state.incomplete) state.footnoteContent = true
        return styles
      }

      // Footnote (inline): Closing
      if (ch === ']' && state.footnoteInline && !state.link) {
        state.formatting = 'footnote-inline-end';
        state.footnoteContent = false
        var styles = getStyles(state);
        state.footnote = false
        state.formatting = false
        state.footnoteInline = false;
        if (state.incomplete) state.incomplete = false
        return styles;
      }

      // Footnote reference definition: start of line
      if (ch === '[' && state.footnoteReferenceDefinition && stream.match(/\S*\]:/, false)) {
        state.formatting = 'footnote-reference-definition-start';
        stream.next()
        var styles = getStyles(state)
        state.footnoteLabel = true
        return styles
      }

      // Footnote reference definition: end of label, start of content
      // Content is everything until end of the line
      if (ch === ']' && state.footnoteReferenceDefinition && state.footnoteLabel) {
        state.footnoteLabel = false
        state.formatting = true
        stream.match(/:\s+/)
        var styles = getStyles(state)
        state.footnoteReferenceDefinitionContent = true
        return styles
      }

      // Footnote (reference-style)
      // Demo: https://regex101.com/r/RH5vFf/2
      if (ch === '[' && !state.image && stream.match(footnoteReferenceRE, false)) {
        stream.next() // So we get the `^` in the opening `[^`
        state.footnoteReference = true
        state.formatting = 'footnote-reference-start';
        state.footnote = true
        var styles = getStyles(state)
        state.footnoteLabel = true
        return styles
      }

      // Footnote (reference): Closing
      if (ch === ']' && state.footnoteReference) {
        // Include the `:` that definitions have
        if (stream.peek() == ':') stream.next()
        state.formatting = 'footnote-reference-end';
        state.footnoteLabel = false
        var styles = getStyles(state);
        state.footnote = false;
        state.footnoteReference = false;
        return styles;
      }

      // Figure
      if (state.figure) {

        // Is it start of figure?
        const isFigureStart = ch === '!' && stream.column() == 0

        if (isFigureStart) {
          stream.next() // Advance to `[`
          state.formatting = 'figure-start'
          var styles = getStyles(state);
          state.linkText = true;
          return styles
        }

        // Is it start of destination?
        // Demo: https://regex101.com/r/IwIrYZ/1
        if (ch === ']' && stream.match(/[^\]]+$/, false)) {
          // Figure: End of text, start of destination
          // E.g. `[text](url "title")`
          //            ^
          state.linkText = false
          state.formatting = true
          var styles = getStyles(state);
          state.inline = state.f = linkDestination
        }
      }


      const isImageStart = ch === '!' && stream.match(imageRE, false)
      const isLinkStart = ch === '[' && !state.link && !state.image

      // if (isFigure)

      // Images and Links: Opening `!` or `[`
      if (isImageStart || isLinkStart) {

        const isInlineStart = stream.match(linkInlineRE, false)
        const isFullReferenceStart = stream.match(linkReferenceFullRE, false)
        const isCollapsedReferenceStart = stream.match(linkReferenceCollapsedRE, false)

        if (isInlineStart || isFullReferenceStart || isCollapsedReferenceStart) {
          if (isImageStart) {
            stream.next() // Advance to `[`
            state.image = true
            state.formatting = 'image-start'

          } else if (isLinkStart) {
            state.link = true
            state.formatting = 'link-start'
          }
        }

        if (isInlineStart) {

          // Inline link: Start of text
          // E.g. `[text](url "title") `
          //       ^
          state.linkInline = true;
          state.formatting = state.formatting.replace('-start', '-inline-start')

          // Is URL missing?
          const textMissing = stream.peek() == ']'
          const urlMissing = stream.match(/[^\]]*?\]\(\)/, false)
          if ((textMissing && state.link) || urlMissing) state.incomplete = true

          var styles = getStyles(state);
          state.linkText = true;
          return styles

        } else if (isFullReferenceStart) {

          // "Full" reference link: Start of text
          // E.g. `[text][label]`
          //       ^
          state.formatting = state.formatting.replace('-start', '-reference-full-start')
          state.linkReference = true
          state.referenceStyleFull = true
          var styles = getStyles(state);
          state.linkText = true;
          return styles

        } else if (isCollapsedReferenceStart) {

          // "Collapsed" reference link: Start of label
          // E.g. `[text][]`
          //       ^
          state.formatting = state.formatting.replace('-start', '-reference-collapsed-start')
          state.linkReference = true
          state.referenceStyleCollapsed = true
          var styles = getStyles(state);
          state.linkLabel = true;
          return styles

        } else if (stream.match(linkReferenceShortcutRE, false)) {

          // TODO: 3/24/2021: Disabling support for shortcut markdown links for now,
          // as they cause too many headaches when trying to also support autocomplete
          // triggering on `[]`.

          // "Shortcut: reference link: Start of label
          // E.g. `[label]`
          //       ^
          // state.formatting = 'link-start'
          // state.link = true;
          // state.linkReference = true
          // state.referenceStyleShortcut = true
          // var styles = getStyles(state);
          // state.linkLabel = true;
          // return styles
        }
      }

      // Link: `]`
      // Continuation of inline, and full or collapsed reference-style links.
      // End of shortcut reference-style links.
      // Handles both inline []() or reference [][] types.
      if (ch === ']' && (state.link || state.image)) {

        state.formatting = true

        let closeLink = false

        if (state.linkInline && stream.match(/\(.*?\)/, false)) {

          // Inline link: End of text, start of destination
          // E.g. `[text](url "title")`
          //            ^
          state.linkText = false
          var styles = getStyles(state);
          state.inline = state.f = linkDestination

        } else if (state.linkReference) {
          if (state.referenceStyleFull) {

            if (state.linkText) {

              // "Full" reference link: End of text, start of label.
              // Advance one character, so we eat the `[`
              // E.g. `[text][label]`
              //            ^
              stream.next()
              state.linkText = false
              var styles = getStyles(state);
              state.linkLabel = true

            } else {

              // "Full" reference link: End of link.
              // E.g. `[text][label]`
              //                   ^
              state.linkLabel = false
              state.formatting = state.image ?
                'image-reference-full-end' :
                'link-reference-full-end'
              var styles = getStyles(state);
              closeLink = true
            }

          } else if (state.referenceStyleCollapsed) {

            // "Collapsed" reference link: End of label.
            // Jump to end of `[]`, and close link.
            // E.g. `[label][]`
            //             ^
            stream.next()
            stream.next()
            state.linkLabel = false
            state.formatting = state.image ?
              'image-reference-collapsed-end' :
              'link-reference-collapsed-end'
            var styles = getStyles(state);
            closeLink = true

          } else if (state.referenceStyleShortcut) {

            // "Shortcut" reference link: End of link
            // E.g. `[label]`
            //             ^
            state.linkLabel = false
            state.formatting = state.image ? 'image-end' : 'link-end'
            var styles = getStyles(state);
            closeLink = true
          }
        }

        // False all the things!
        if (closeLink) {
          state.image = false;
          state.link = false;
          state.linkReference = false
          state.referenceStyleFull = false
          state.referenceStyleCollapsed = false
          state.referenceStyleShortcut = false
        }

        return styles;
      }

      if (state.linkReference && ch === '[') {

        // Reference link (full or collapsed): Start of label.
        // E.g. `[text][label]` or `[text][]`
        //             ^                  ^
        state.formatting = true
        var styles = getStyles(state);
        state.linkLabel = true
        return styles;
      }

      // Raw HTML (XML?)
      // Demo: https://regex101.com/r/3d252R/6

      // Original regex, from Markdown.js: 
      // if (modeCfg.xml && ch === '<' && !state.link && stream.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>|$))/i, false)) {

      // My upgraded version with support for additional conditions:
      // Demo: https://regex101.com/r/tzxq58/4
      // if (modeCfg.xml && ch === '<' && !state.link && stream.match(/^((\/[a-z][a-z0-9-]*\s*>)|(!--(?!>)[\s\S]+?[^-]-->)|(\?.*?\?>)|(!\[CDATA\[.*?\]\]>)|(\!?[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*="\s*[^>]+"|'\s*[^>]+')?)*\s*\/?>))/i, false)) {

      // Original, modified to remove support for open-ended tags, by eliminating `|$` from the look-ahead.
      if (modeCfg.xml && ch === '<' && !state.link && stream.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>))/i, false)) {

        // Josh 6/17/2021: This seems to enable support for markdown inside html tags 
        // ala this thread https://stackoverflow.com/questions/29368902/how-can-i-wrap-my-markdown-in-an-html-div
        // but I never saw it working in my tests, so am disabling, for sake of performance.
        // var end = stream.string.indexOf(">", stream.pos);
        // if (end != -1) {
        //   var atts = stream.string.substring(stream.start, end);
        //   if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) state.md_inside = true;
        // }

        stream.backUp(1);
        state.htmlState = CodeMirror.startState(htmlMode);
        state.htmlState.isStart = true
        return switchBlock(stream, state, htmlBlock);
      }

      // Individual XML tags (anything not caught by multi-line check, above)
      // Multi-line tags -not- caught.
      // CommonMark: Raw HTML: https://spec.commonmark.org/0.29/#raw-html
      // Demo: https://regex101.com/r/XYkJkx/4
      // if (modeCfg.xml && ch === '<' && (
      //   stream.match(/^(?!\d*>|__)([^\s]|[^\s[][^!>/]*?)(?:>|\/>)/)
      // )) {
      //   state.md_inside = false;
      //   return "tag";
      // }

      // Space
      if (ch === ' ') {
        if (stream.match(/^ +$/, false)) {
          state.trailingSpace++;
        } else if (state.trailingSpace) {
          state.trailingSpaceNewLine = true;
        }
      }

      // Strikethrough
      if (modeCfg.strikethrough) {
        if (ch === '~' && stream.eatWhile(ch)) {
          if (state.strikethrough) { // Remove strikethrough
            state.formatting = 'strikethrough-end'
            var t = getStyles(state);
            state.strikethrough = false;
            return t;
          } else if (stream.match(/^[^\s]/, false)) { // Add strikethrough
            state.strikethrough = true;
            state.formatting = 'strikethrough-start'
            return getStyles(state);
          }
        } else if (ch === ' ') {
          if (stream.match(/^~~/, true)) { // Probably surrounded by space
            if (stream.peek() === ' ') { // Surrounded by spaces, ignore
              return getStyles(state);
            } else { // Not surrounded by spaces, back up pointer
              stream.backUp(2);
            }
          }
        }
      }

      // Tex Math (inline)
      // See: https://pandoc.org/MANUAL.html#math
      // Demo: https://regex101.com/r/Plban8/1/
      if (!state.texMathInline && ch === '$' && stream.match(/[^\s][^$]+[^\s]\$(?!\d)/, false)) {
        state.formatting = true
        state.texMathInline = true
        return getStyles(state);
      }

      if (state.texMathInline) {
        if (ch !== '$') {
          stream.match(/[^$]*$/) // Jump to end
          return getStyles(state)
        } else {
          state.formatting = true
          var styles = getStyles(state)
          state.texMathInline = false
          return styles
        }
      }

      return getStyles(state);
    }

    // Parse link destinations inside parentheses (...)
    // Used for both (non-reference type) links []() and images ![]()
    function linkDestination(stream, state) {

      // Check if space, and return NULL if so (to avoid marking the space)
      // if (stream.eatSpace()) return null;

      var ch = stream.next();

      // Start
      if (ch === '(') {

        state.formatting = true

        // Handle case where URL is missing `()`
        if (stream.peek() == ')') {
          stream.next()
          state.incomplete = true
          if (state.figure) {
            state.formatting = 'figure-end'
          } else if (state.image) {
            state.formatting = 'image-inline-end'
          } else if (state.link) {
            state.formatting = 'link-inline-end'
          }
          var styles = getStyles(state)
          reset()
          return styles
        }

        // Start states
        var styles = getStyles(state)
        state.linkUrl = true;
        return styles
      }

      // Jump to end of URL
      if (state.linkUrl) {
        stream.match(/.*?(?=\)|\s)/)
        var styles = getStyles(state)
        state.linkUrl = false
        return styles
      }

      // Is there a title? 
      // Demo: https://regex101.com/r/IrMSgJ/1
      if (ch === ' ' && stream.match(/\s*(("|').*?\2\))|(\(.*?\)\))/, false)) {
        stream.match(/\s*("|'|\()/) // Advance to start of title text
        state.formatting = true
        var styles = getStyles(state)
        state.linkTitle = true
        return styles
      }

      // If there's a title, jump to the end of it
      if (state.linkTitle) {
        stream.match(/.*?(?="|'|\))/)
        var styles = getStyles(state)
        state.linkTitle = false
        state.formatting = true
        return styles
      }

      // If there's a title, jump to end of it
      // Demo: https://regex101.com/r/TqWExF/1/
      // if (state.linkTitle && ch !== ')') {
      //   stream.match(/^.*?("|'|\))(?=\))/)
      //   return getStyles(state)
      // }

      // End
      // if (ch.equalsAny("'", '"',  )) {
      if (ch === ')' || ch === '"' || ch === "'") {
        if (stream.peek() == ')') stream.next()
        state.linkUrl = false;
        state.linkTitle = false;
        if (state.figure) {
          state.formatting = 'figure-end'
        } else if (state.image) {
          state.formatting = 'image-inline-end'
        } else if (state.link) {
          state.formatting = 'link-inline-end'
        }
        // state.formatting = state.image ? 'image-inline-end' : 'link-inline-end'
        var styles = getStyles(state);
        reset()
        return styles;
      }

      // Reset to normal
      function reset() {
        state.f = state.inline = inlineNormal;
        state.link = false
        state.linkInline = false
        state.linkReference = false
        state.linkUrl = false
        state.image = false
        if (state.incomplete) state.incomplete = false
      }
    }

    // Parse reference link definitions.
    function linkReferenceDefinition(stream, state) {

      var ch = stream.next()

      // Label
      if (ch == '[') {
        // if (!state.link && stream.match(/^\[[^\]]+?\]:/), false) {
        // state.link = true
        // state.linkReference = true
        state.linkReferenceDefinition = true
        state.formatting = 'link-reference-definition-start'
        var styles = getStyles(state)
        state.linkLabel = true
        return styles
      }

      // Jump to end of the label
      if (state.linkLabel && ch !== ']') {
        stream.match(/.*?(?=\])/)
        var styles = getStyles(state)
        state.linkLabel = false
        return styles
      }

      // Close label
      if (ch === ']') {
        // Include `:` and following whitespace
        stream.match(/:\s*/)
        state.formatting = true
        var styles = getStyles(state)
        state.linkUrl = true
        return styles
      }

      // Jump to end of URL
      if (state.linkUrl) {
        stream.match(/(?:<[^<>\n]*>|(?!<)[^\s]+)/)
        var styles = getStyles(state)
        state.linkUrl = false
        // If there's no title ahead, end the reference definition
        if (!stream.match(/\s*(("|').*?\2)|(\(.*?\)\))/, false)) {
          reset()
        }
        return styles
      }

      // Is there a title? 
      // Demo: https://regex101.com/r/IrMSgJ/1
      // if (ch === ' ' && stream.match(/\s*(("|').*?\2\))|(\(.*?\)\))/, false)) {
      //   stream.match(/\s*("|'|\()/) // Advance to start of title text
      //   state.formatting = true
      //   var styles = getStyles(state)
      //   state.linkTitle = true
      //   return styles
      // }

      // If there's a title, jump to the end of it
      // if (state.linkTitle) {
      //   stream.match(/.*?(?="|'|\))/)
      //   var styles = getStyles(state)
      //   state.linkTitle = false
      //   state.formatting = true
      //   return styles
      // }

      // Title found
      if (stream.match(/(".*?")|('.*?')|(\(.*?\))/, false)) {
        stream.match(/\s*("|'|\()/) // Advance to start of title text
        state.formatting = true
        var styles = getStyles(state)
        state.linkTitle = true
        return styles
      }

      // If there's a title, jump to the end of it
      if (state.linkTitle) {
        stream.match(/.*?(?="|'|\))/)
        var styles = getStyles(state)
        state.linkTitle = false
        state.formatting = true
        reset()
        return styles
      }

      // If we're al eol(), or there are only spaces left, reset().
      // if (stream.eol() || stream.match(/\s+$/)) {
      //   state.formatting = true // So we get closing character of title
      //   var styles = getStyles(state)
      //   reset()
      //   return styles
      // }

      function reset() {
        state.f = state.inline = inlineNormal;
        state.link = false
        state.linkReference = false
        state.linkReferenceDefinition = false
        state.linkLabel = false
        state.linkUrl = false
        state.linkTitle = false
        state.image = false
      }

      // Have to have this, or we get error
      // stream.next();
    }

    function citation(stream, state) {

      var ch = stream.next()

      // Reset each time
      state.citationKey = false

      // if (ch === '@'){
      //   state.citationKey = true
      //   return getType(state)
      // }

      // Key
      // Demo: https://regex101.com/r/VdP0V5/1
      if (ch === '@' && stream.match(/^[a-zA-Z0-9_]*[a-zA-Z0-9_:.#$%&\-+?<>~/]*?(?=[; ,\]{])/, true)) {
        state.citationKey = true
        return getStyles(state)
      }

      // End
      if (ch === ']') {

        state.formatting = 'citation-end'
        var styles = getStyles(state);

        // Reset to normal
        state.f = state.inline = inlineNormal;
        state.citation = false
        state.citationKey = false

        return styles;
      }

      return getStyles(state)
    }

    // function texMathDisplay(stream, state) {
    //   var ch = stream.next()
    //   // End
    //   if (ch === '$$') {

    //     if (modeCfg.highlightFormatting) state.formatting = "texMathDisplay";
    //     var type = getType(state);

    //     // Reset to normal
    //     state.texMathDisplay = false
    //     state.f = state.inline = inlineNormal;

    //     return type;
    //   }
    // }


    // OLD (inheritied from original mode, I think)
    // TODO

    // function footnoteReferenceDefinition(stream, state) {

    //   if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
    //     state.f = footnoteLinkInside;
    //     stream.next(); // Consume [
    //     if (modeCfg.highlightFormatting) state.formatting = "link";
    //     state.link = true;
    //     state.linkReferenceDefinition = true;
    //     state.linkText = true;
    //     return getType(state);
    //   }
    //   return switchInline(stream, state, inlineNormal);
    // }

    // function footnoteLinkInside(stream, state) {
    //   if (stream.match(/^\]:/, true)) {
    //     state.f = state.inline = footnoteUrl;
    //     if (modeCfg.highlightFormatting) state.formatting = "link";
    //     var returnType = getType(state);
    //     state.linkText = false;
    //     return returnType;
    //   }

    //   stream.match(/^([^\]\\]|\\.)+/, true);

    //   return tokenTypes.linkText;
    // }


    // function footnoteUrl(stream, state) {
    //   // Check if space, and return NULL if so (to avoid marking the space)
    //   // if (stream.eatSpace()) {
    //   //   return null;
    //   // }
    //   // Match URL
    //   stream.match(/^[^\s]+/, true);
    //   // Check for link title
    //   if (stream.peek() === undefined) { // End of line, set flag to check next line
    //     state.linkTitle = true;
    //   } else { // More content on line, check if link title
    //     stream.match(/^(?:\s+(?:"(?:[^"\\]|\\\\|\\.)+"|'(?:[^'\\]|\\\\|\\.)+'|\((?:[^)\\]|\\\\|\\.)+\)))?/, true);
    //   }
    //   state.f = state.inline = inlineNormal;
    //   return tokenTypes.linkUrl;
    // }






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

          fencedcodeblock: false,

          footnote: false,
          footnoteInline: false,
          footnoteLabel: false,
          footnoteContent: false,
          footnoteReference: false,
          footnoteReferenceDefinition: false,
          referenceDefinitionAnchor: false,

          formatting: false,
          figure: false,

          image: false,
          imageMarker: false,
          imageAltText: false,
          imageLabel: false,
          imageReference: false,
          imageReferenceDefinition: false,

          link: false,
          linkInline: false,
          linkReference: false,
          linkReferenceDefinition: false,
          linkText: false,
          linkLabel: false,
          linkUrl: false,
          linkTitle: false,
          autolinkUrl: false,
          emailInBrackets: false,
          bareUrl: false,

          referenceStyleFull: false,
          referenceStyleCollapsed: false,
          referenceStyleShortcut: false,

          incomplete: false,
          citation: false,
          code: 0,
          em: false,
          strong: false,
          header: 0,
          setext: 0,
          taskList: false,
          taskClosed: false,
          taskOpen: false,
          list: false,
          listStack: [],
          quote: 0,
          trailingSpace: 0,
          trailingSpaceNewLine: false,
          strikethrough: false,
          emoji: false,
          fencedEndRE: null,
          texMathInline: false,
          texMathDisplay: false,
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

          fencedcodeblock: s.fencedcodeblock,

          footnote: s.footnote,
          footnoteInline: s.footnoteInline,
          footnoteLabel: s.footnoteLabel,
          footnoteContent: s.footnoteContent,
          footnoteReference: s.footnoteReference,
          footnoteReferenceDefinition: s.footnoteReferenceDefinition,
          referenceDefinitionAnchor: s.referenceDefinitionAnchor,

          formatting: s.formatting,
          figure: s.figure,

          image: s.image,
          imageMarker: s.imageMarker,
          imageAltText: s.imageAltText,
          imageLabel: s.imageLabel,
          imageReference: s.imageReference,
          imageReferenceDefinition: s.imageReferenceDefinition,

          link: s.link,
          linkInline: s.linkInline,
          linkReference: s.linkReference,
          linkReferenceDefinition: s.linkReferenceDefinition,
          linkText: s.linkText,
          linkLabel: s.linkLabel,
          linkUrl: s.linkUrl,
          linkTitle: s.linkTitle,
          autolinkUrl: s.autolinkUrl,
          emailInBrackets: s.autolinkUrl,
          bareUrl: s.autolinkUrl,

          referenceStyleFull: s.referenceStyleFull,
          referenceStyleCollapsed: s.referenceStyleCollapsed,
          referenceStyleShortcut: s.referenceStyleShortcut,

          incomplete: s.incomplete,
          citation: s.citation,
          code: s.code,
          em: s.em,
          strong: s.strong,
          strikethrough: s.strikethrough,
          emoji: s.emoji,
          header: s.header,
          setext: s.setext,
          taskList: s.taskList,
          list: s.list,
          listStack: s.listStack.slice(0),
          quote: s.quote,
          indentedCode: s.indentedCode,
          trailingSpace: s.trailingSpace,
          trailingSpaceNewLine: s.trailingSpaceNewLine,
          md_inside: s.md_inside,
          fencedEndRE: s.fencedEndRE,
          texMathInline: s.texMathInline,
          texMathDisplay: s.texMathDisplay,
          taskClosed: s.taskClosed,
          taskOpen: s.taskOpen,
        };
      },

      /**
       * The function is called first, for each token in the doc.
       * It delegates to other functions.
       * If line is new, block functions (blockNormal or htmlBlock)
       * are called first. They determine what kind of line it is.
       * Else, call inlineNormal.
       * @param {*} stream 
       * @param {*} state 
       * @returns 
       */
      token: function (stream, state) {

        // Reset state.formatting
        state.formatting = false;

        // New line found
        const newLineFound = stream != state.thisLine.stream
        if (newLineFound) {

          // Update state
          state.header = 0;

          // Find blank lines
          // If we find a line with only whitespace, and we're NOT currently in a footnote reference definition, make it a blankLine(). We allow empty lines inside footnote reference definitions, so we want to process them the normal way (via blockNormal, inlineNormal, etc).
          // TODO: 3/24/2021: Re-enable multi-line footnote reference definitions in future.
          // TODO: 6/17/2021: Re-enable and update to new blankLine logic
          // if (!state.footnoteReferenceDefinition && stream.match(/^\s*$/, true)) {
          //   blankLine(state);
          //   return null;
          // }

          // If line contains only whitespace, treat as a blank line
          if (stream.match(/^\s*$/, true)) {
            // blankLine will return `null` or a line style.
            return blankLine(state);
          }

          state.prevLine = state.thisLine
          state.thisLine = { stream: stream }

          // Reset state.trailingSpace
          state.trailingSpace = 0;
          state.trailingSpaceNewLine = false;

          // If `!state.localState`, it means markdown is handling parsing.
          // If it's defined, it means another mode is. E.g. JavaScript mode
          // inside a fenced code block.
          if (!state.localState) {

            // Set state.f to whatever state.block is
            // (so it runs once at start of each line)
            state.f = state.block;

            // If state.block is not html...
            if (state.f != htmlBlock) {

              // Determine line indentation (initial whitespace)
              // and skip to end of that whitespace.
              var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, expandedTab).length;
              state.indentation = indentation;
              state.indentationDiff = null;

              // Footnote reference definitions can span multiple lines: "Subsequent paragraphs are indented to show that they belong to the previous footnote." — https://pandoc.org/MANUAL.html#footnotes. So if `footnote-reference-definition` state is active, and this line is indented, we add `line-footnote-reference-definition-continued` class.

              // TODO: 3/31/2021: Revisit this. It may be breaking things to not disable footnote reference definitions.
              if (indentation > 0) {
                if (state.footnoteReferenceDefinition) {
                  return 'line-footnote-reference-definition-continued content'
                } else {
                  // Add 'indent' class. We can then use this to fine tune 
                  // the rendered width of our indentation, using css.
                  return 'indent'
                  // return null
                }
              }
            }
          }
        }

        // Call state.f. This will point to either 
        // blockNormal or inlineNormal.
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
      getType: getStyles,
      blockCommentStart: "<!--",
      blockCommentEnd: "-->",
      // closeBrackets: "**__()[]{}''\"\"``",
      fold: "markdown"
    };
    return mode;
  }, "xml");

  CodeMirror.defineMIME("text/markdown", "markdown");
  CodeMirror.defineMIME("text/x-markdown", "markdown");
});
