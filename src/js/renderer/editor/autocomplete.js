import { Pos } from "codemirror"
import { isUrl, isValidHttpUrl } from "../../shared/utils"
import * as WizardManager from "../WizardManager"
import { getClipboardContents, getFromAndTo } from "./editor-utils"
import { getElementAt } from "./map"

export function checkIfWeShouldShowAutocomplete(cm, evt) {

  const ranges = cm.listSelections()

  // Show autocomplete only if
  // - There are not multiple selections
  // - It's not already visible
  // - Key pressed was not one those listed (e.g. Escape)
  const showAutocomplete =
    ranges.length == 1 &&
    !cm.state.completionActive &&
    !evt.key.equalsAny(' ', 'Meta', 'Backspace', 'Enter', 'Shift', 'Alt', 'Escape', 'Control', 'Tab', 'CapsLock', 'Home', 'PageUp', 'PageDown') &&
    !evt.key.includesAny('Arrow')

  // Show autocomplete
  if (showAutocomplete) {
    // We align autocomplete with start of the word
    // (true) if something is selected, or cursor (false), 
    // otherwise.
    const alignWithWord = cm.somethingSelected()
    cm.showHint({ ...autocompleteOptions, alignWithWord })
  }
}

const autocompleteOptions = {
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


const allowedMarkdownStartCharsRE = /[!\^\[@\w]/
const allowedMarkdownEndCharsRE = /[@\w\]]/


// Hints
// Here we define the hints that can be rendered in the autocomplete menu.
// The `findHint` function below determines which to show, based on the
// word that's around the cursor position.

// Element hints
const citation = {
  text: '[@]',
  displayText: 'Citation',
  className: 'small-size element-citation',
  hint: (cm, data, self) => {
    cm.replaceRange(`[@${data.text}]`, data.from, data.to)
    openWizard(cm, data.from)
  }
}

const inlineFootnote = {
  text: '^[]',
  displayText: 'Footnote',
  className: 'small-size element-inline-footnote',
  hint: (cm, data, self) => {
    cm.replaceRange(`^[${data.text}]`, data.from, data.to)
    openWizard(cm, data.from)
  }
}

const inlineImage = {
  text: '![]()',
  displayText: 'Image',
  className: 'small-size element-inline-image',
  hint: (cm, data, self) => {
    const textIsUrl = data.text.length && isUrl(data.text)
    if (textIsUrl) {
      // Insert text as url
      cm.replaceRange(`![](${data.text})`, data.from, data.to)
    } else {
      // Insert text as alt text / caption
      cm.replaceRange(`![${data.text}]()`, data.from, data.to)
    }
    openWizard(cm, data.from)
  }
}

const inlineLink = {
  text: '[]()',
  displayText: 'Link',
  className: 'small-size element-inline-link',
  hint: (cm, data, self) => {
    const textIsUrl = data.text.length && isUrl(data.text)
    if (textIsUrl) {
      // Insert text as url
      cm.replaceRange(`[](${data.text})`, data.from, data.to)
    } else {
      // Insert text as alt text / caption
      cm.replaceRange(`[${data.text}]()`, data.from, data.to)
      openWizard(cm, data.from)
    }
  }
}

function openWizard(cm, pos) {

  // Get the DOM element of the element
  const element = getElementAt(cm, pos.line, pos.ch + 1)
  const { left, right, top, bottom } = cm.charCoords(Pos(element.line, element.start), "window")
  const centerOfElementX = right - ((right - left) / 2)
  const centerOfElementY = bottom - ((bottom - top) / 2)
  const domElement = document.elementFromPoint(centerOfElementX, centerOfElementY)

  // Open wizard
  WizardManager.store.setTarget({
    cm,
    panelId: cm.panel.id,
    suppressWarnings: true,
    domElement,
    element,
    openedBy: { tabOrClick: true, hover: false, metaKey: false, altKey: false }
  })
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

      } else if (token?.type?.includes('line-fencedcodeblock-firstLine')) {

        // Decrement start until we find whitespace
        while (start && /[^`]/.test(line.charAt(start - 1))) --start

        // The string we're going to check for in completions
        const word = line.slice(start, end)?.toLowerCase()

        const languageHints = fencedCodeBlockHints.filter(({ text, displayText }) => {
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

        // Find start and end characters:
        // - Decrement start until we find whitespace
        // - Increment end until we find whitespace
        while (start && allowedMarkdownStartCharsRE.test(line.charAt(start - 1))) --start
        while (end < line.length && allowedMarkdownEndCharsRE.test(line.charAt(end))) ++end

        // Get the string we're going to check for in completions
        const string = line.slice(start, end).toLowerCase()

        // Is string empty square brackets? E.g. "[|]"
        // If yes, return full automcomplete options
        const isEmptySquareBrackets = string == '[]'
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
            text: "",
            selectedHint: 0
          })
        }

        // Is string an image? E.g. "![|]"
        const isImage = string.substring(0, 2) == "![" && string.slice(-1) == "]"
        if (isImage) {
          return accept({
            list: [inlineImage],
            from: Pos(cursor.line, start),
            to: Pos(cursor.line, end),
            text: string.slice(2, string.length - 1), // Text inside brackets
            selectedHint: 0
          })
        }

        // Is string an inline footnote? E.g. "^[|]"
        const isFootnote = string.substring(0, 2) == "^[" && string.slice(-1) == "]"
        if (isFootnote) {
          return accept({
            list: [inlineFootnote],
            from: Pos(cursor.line, start),
            to: Pos(cursor.line, end),
            text: string.slice(2, string.length - 1), // Text inside brackets
            selectedHint: 0
          })
        }

        // Is string a citation? E.g. "[@|]"
        const isCitation = string.substring(0, 2) == "[@" && /\[@[^\]]*?\]/.test(string)
        if (isCitation) {
         
          const text = string.slice(2, string.length - 1) // Text inside brackets
          const textIsEmpty = text == ""

          // As user starts to type, show hints
          const doc = window.files.byId[cm.panel.docId]
          const bibliographyExists = doc.bibliography.exists && doc.bibliography.isCslJson
          if (!bibliographyExists) {
            console.warn("Bibliography not found")
            return accept(null)
          }
          const bibliographyString = await window.api.invoke('getBibliography', doc.bibliography.path)
          let bibliography = JSON.parse(bibliographyString)

          // If user has entered text, filter results by title  
          if (!textIsEmpty) {
            bibliography = bibliography.filter((ref) => {
              const titleMatches = ref.title.toLowerCase().includes(text.toLowerCase())
              const authorMatches = ref.author?.some((author) => {
                const familyNameMatches = author.family?.toLowerCase().includes(text.toLowerCase())
                // const givenNameMatches = author.given?.toLowerCase().includes(text.toLowerCase())
                return familyNameMatches
              })
              return titleMatches || authorMatches
            })
          }

          // Make array of objects with text and displayText
          const matches = bibliography.map((ref) => {
                          
            // Define secondary text line
            const authorFamily = ref.author?.[0].family ?? ""
            const year = ref.issued?.["date-parts"]?.[0][0] ?? ""
            const container = ref["container-title"] ?? ""
            
            let secondaryDisplayText = ""           
            if (authorFamily && !year) {
              secondaryDisplayText = authorFamily
            } else if (authorFamily && year) {
              secondaryDisplayText = `${authorFamily} (${year})`
            } else if (!authorFamily && year) {
              secondaryDisplayText = `(${year})`
            }
            if (container && !authorFamily && !year) {
              secondaryDisplayText = container
            } else if (container) {
              secondaryDisplayText += `, ${container}`
            }
           
            return { 
              text: ref.id, 
              displayText: ref.title,
              secondaryDisplayText,
              className: `regular-size show-separator bold-primary citation ${ref.type}`
            }
          })

          return accept({
            list: matches,
            from: Pos(cursor.line, start + 2),
            to: Pos(cursor.line, end - 1),
            text,
            selectedHint: 0
          })
        }

        // Is string square brackets around selection? E.g. "[jones]"
        // If yes, return full automcomplete options
        const isSquareBracketsAroundSelection = /\[[^\]]+?\]/.test(string)
        if (isSquareBracketsAroundSelection) {
          return accept({
            list: [
              inlineLink,
              inlineFootnote,
              inlineImage,
              citation
            ],
            from: Pos(cursor.line, start),
            to: Pos(cursor.line, end),
            text: string.slice(1, string.length - 1),
            selectedHint: 0
          })
        }
      }

      // Else, if nothing matched...
      return accept(null)

    }, 10)
  })
}

// "hint: function. ... By default, hinting only works when there is no selection. You can give a hinting function a supportsSelection property with a truthy value to indicate that it supports selections."
// https://codemirror.net/doc/manual.html#addon_show-hint
// Solution for adding properties to function, from:
// https://stackoverflow.com/a/20734003
findHints.supportsSelection = true

