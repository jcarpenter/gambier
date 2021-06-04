import { Pos } from "codemirror"
import { isUrl, isValidHttpUrl } from "../../shared/utils"
import { getClipboardContents, getFromAndTo } from "./editor-utils"

export const autocompleteOptions = {
  hint: findHints,
  // Determines whether, when only a single completion is available, it is completed without showing the dialog. Defaults to true.
  completeSingle: false,
  // "Whether the pop-up should be horizontally aligned with the start of the word (true, default), or with the cursor (false)."
  alignWithWord: false,
  // "A regular expression object used to match characters which cause the pop up to be closed (default: /[\s()\[\]{};:>,]/). If the user types one of these characters, the pop up will close, and the endCompletion event is fired on the editor instance."
  closeCharacters: /[\s()\[\]{};:>,]/,
  // "Allows you to provide a custom key map of keys to be active when the pop-up is active. The handlers will be called with an extra argument, a handle to the completion menu, which has moveFocus(n), setFocus(n), pick(), and close() methods (see the source for details), that can be used to change the focused element, pick the current element or close the menu. Additionally menuSize() can give you access to the size of the current dropdown menu, length give you the number of available completions, and data give you full access to the completion returned by the hinting function\."
  extraKeys: {
    // 'Enter': (cm, menu) => { console.log(menu) },
    'Esc': (cm, menu) => { menu.close() }
  }
}


const allowedMarkdownStartCharsRE = /[!\[@\w]/
const allowedMarkdownEndCharsRE = /[@\w\]]/


// Hints
// Here we define the hints that can be rendered in the autocomplete menu.
// The `findHint` function below determines which to show, based on the
// word that's around the cursor position.

// Element hints

const citation = {
  text: '[@]',
  displayText: 'Citation',
  className: 'citation',
  hint: (cm, data, self) => { 
    cm.replaceRange(`@${data.text}`, data.from, data.to)
  }
}

const inlineFootnote = {
  text: '[^]',
  displayText: 'Footnote',
  className: 'inlineFootnote',
  hint: (cm, data, self) => { 
    cm.replaceRange(`^${data.text}`, data.from, data.to)
  }
}

const inlineImage = {
  text: '![]()',
  displayText: 'Image',
  className: 'inlineImage',
  hint: (cm, data, self) => { 
    // Expand to get brackets as well
    // Lion --> [Lion]
    const from = { line: data.from.line, ch: data.from.ch - 1}
    const to = { line: data.to.line, ch: data.to.ch + 1}
    const textIsUrl = data.text.length && isUrl(data.text)
    if (textIsUrl) {
      // Insert text as url
      cm.replaceRange(`![](${data.text})`, from, to)
    } else {
      // Insert text as alt text / caption
      cm.replaceRange(`![${data.text}]()`, from, to)
    }
  }
}

const inlineLink = {
  text: '[]()',
  displayText: 'Link',
  className: 'inlineLink',
  hint: async (cm, data, self) => {     
    // Expand to get brackets as well
    // Lion --> [Lion]
    const from = { line: data.from.line, ch: data.from.ch - 1}
    const to = { line: data.to.line, ch: data.to.ch + 1}
    const textIsUrl = data.text.length && isUrl(data.text)
    if (textIsUrl) {
      // Insert text as url
      cm.replaceRange(`[](${data.text})`, from, to)
    } else {
      // Insert text as alt text / caption
      cm.replaceRange(`[${data.text}]()`, from, to)
    }
  }
}

// Fenced code block hints

let fencedCodeBlockHints = [
  { text: 'c', displayText: 'C' },
  { text: 'c++', displayText: 'C++' },
  { text: 'csharp', displayText: 'C#' },
  { text: 'css', displayText: 'CSS' },
  { text: 'elm', displayText: 'Elm' },
  { text: 'html', displayText: 'HTML' },
  { text: 'js', displayText: 'JavaScript' },
  { text: 'json', displayText: 'JSON' },
  { text: 'latex', displayText: 'Latex' },
  { text: 'lua', displayText: 'Lua' },
  { text: 'markdown', displayText: 'Markdown' },
  { text: 'php', displayText: 'PHP' },
  { text: 'python', displayText: 'Python' },
  { text: 'ruby', displayText: 'Ruby' },
  { text: 'rust', displayText: 'Rust' },
  { text: 'sql', displayText: 'SQL' },
  { text: 'stex', displayText: 'sTeX' },
  { text: 'swift', displayText: 'Swift' },
  { text: 'xml', displayText: 'XML' },
  { text: 'yaml', displayText: 'YAML' },
]



/**
 * Return list of hints to show, based on the word around the cursor.
 * "This function takes an editor instance and an options object, and returns a {list, from, to} object, where list is an array of strings or objects (the completions), and from and to give the start and end of the token that is being completed as {line, ch} objects. An optional selectedHint property (an integer) can be added to the completion object to control the initially selected hint."
 * https://codemirror.net/doc/manual.html#addon_show-hint
 * @param {*} cm 
 * @param {*} option 
 * @returns 
 */
function findHints(cm, options) {
  // console.log(options)
  return new Promise((accept) => {
    setTimeout(async () => {

      const cursor = cm.getCursor()
      const line = cm.getLine(cursor.line)
      const mode = cm.getModeAt(cm.getCursor())

      let start, end

      // Check for matches:
      // First check the mode.

      if (cm.somethingSelected()) {
        const ranges = cm.listSelections()
        const { from, to } = getFromAndTo(ranges[0])
        start = from.ch
        end = to.ch
      } else {
        start = cursor.ch
        end = cursor.ch
      }

      const token = cm.getTokenAt(Pos(cursor.line, start))

      if (mode.name == 'yaml') {

        // In front matter, we only support autocomplete for tags
        // And we need to distinguish between list of tags, and array.

        const isTagList = token.type.includesAll('tag', 'line-tags',)
        // const isTagsArray = token.type.includesAll('tag', 'line-tags',)

        // The string we're going to check for in completions
        start = 2
        end = line.length
        const word = line.slice(start, end).toLowerCase()

        // Check if we're entering tags
        if (isTagList) {

          // Filter to tags that start with the word,
          // but don't match it completely. If there's a
          // perfect match, the user doesn't need autocomplete.
          const tagHints = window.tags.filter((t) => {
            return t.toLowerCase().startsWith(word.toLowerCase()) &&
              t.toLowerCase() !== word.toLowerCase()
          })

          if (tagHints.length) {
            return accept({
              list: tagHints,
              from: Pos(cursor.line, start),
              to: Pos(cursor.line, end),
              selectedHint: 0
            })
          }
        }

      } else if (token.type.includes('line-fencedcodeblock-start')) {
        
        // Decrement start until we find whitespace
        while (start && /[^`]/.test(line.charAt(start - 1))) --start

        // The string we're going to check for in completions
        const word = line.slice(start, end)?.toLowerCase()

        const languageHints = fencedCodeBlockHints.filter(({text, displayText}) => {
          return text.toLowerCase().startsWith(word.toLowerCase()) || 
          displayText.toLowerCase().startsWith(word.toLowerCase())
        })

        if (languageHints.length) {
          return accept({
            list: languageHints,
            from: Pos(cursor.line, start),
            to: Pos(cursor.line, end),
            selectedHint: 0
          })
        }


      } else if (mode.name == 'markdown') {

        // Decrement start until we find whitespace
        while (start && allowedMarkdownStartCharsRE.test(line.charAt(start - 1))) --start

        // Increment end until we find whitespace
        while (end < line.length && allowedMarkdownEndCharsRE.test(line.charAt(end))) ++end

        // The string we're going to check for in completions
        const word = line.slice(start, end).toLowerCase()

        // Empty square brackets: []
        const isEmptySquareBrackets = word == '[]'
        // Square brackets around selection: [kitty]
        // Demo: https://regex101.com/r/emhxXZ/1/
        const isSquareBracketsAroundSelection = word.match(/\[[^\]]+?\]/)
        // Inline footnote [^|]
        // Citation [@|]
        // Image ![|]

        // If the above match, return a list of hints.
        // "...returns a {list, from, to} object, where list is an array of strings or objects (the completions), and from and to give the start and end of the token that is being completed as {line, ch} objects. An optional selectedHint property (an integer) can be added to the completion object to control the initially selected hint."

        // if (isSquareBracketsAroundSelection) {
        //   const clipboard = await getClipboardContents()
        //   const clipboardIsUrl = isValidHttpUrl(clipboard)
        //   console.log(clipboard)        
        //   console.log(clipboardIsUrl)        
        // }

        if (isEmptySquareBrackets) {
          return accept({
            list: [
              inlineLink,
              inlineFootnote,
              inlineImage,
              citation
            ],
            from: Pos(cursor.line, start),
            to: Pos(cursor.line, end),
            text: '',
            selectedHint: 0
          })
        } else if (isSquareBracketsAroundSelection) {
          return accept({
            list: [
              inlineLink,
              inlineFootnote,
              inlineImage,
              citation
            ],
            // Pass text and from/to _inside_ the brackets
            // E.g. [lion] --> lion
            from: Pos(cursor.line, start + 1),
            to: Pos(cursor.line, end - 1),
            text: word.slice(1, word.length - 1),
            selectedHint: 0
          })
        }
      }

      // Else, if nothing matched...

      return accept(null)
    }, 100)
  })
}

// "hint: function. ... By default, hinting only works when there is no selection. You can give a hinting function a supportsSelection property with a truthy value to indicate that it supports selections."
// https://codemirror.net/doc/manual.html#addon_show-hint
// Solution for adding properties to function, from:
// https://stackoverflow.com/a/20734003
findHints.supportsSelection = true

