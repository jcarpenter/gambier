// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// -------- MODULES -------- //

// General-purpose
const fse = require('fs-extra')
const config = require('./js/config.js')

// Citations
const CSL = require('citeproc')
const getLocators = require('./js/getLocators.js')
const getCitationId = require('./js/getCitationId.js')
const getCitationLocator = require('./js/getCitationLocator.js')
const markText = require('./js/markText.js')
// const makeCitationObjects = require('./js/makeCitationObjects.js')

// CodeMirror
const gambierMode = require('./js/gambierCodeMirrorMode.js')


// -------- SHARED VARIABLES -------- //

let editor
let lastCursorLine = 0
let locators
let citeproc
let citationItems

// -------- SETUP -------- //

/**
 * - Load files (e.g. bibliography items, CSL style)
 * - Get locators for the specified locale
 * - Create engine (citeproc)
 */
async function setupCitations() {

  // Load bibliography (list of CSL "items")
  // Per https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html
  citationItems = JSON.parse(await fse.readFile(config.citationItems))

  // Load CSL styles
  const citationStyle = await fse.readFile(config.citationStyle, 'utf8')

  // Load locale
  const citationLocale = await fse.readFile(config.citationLocale, 'utf8')

  // Get valid locators from locale file
  locators = getLocators(citationLocale)

  // Setup citeproc
  citeproc = new CSL.Engine(sys = {
    // Given a language tag in RFC-4646 form, this method retrieves the
    // locale definition file.  This method must return a valid *serialized*
    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
    // processor will fail on a native XML object or buffer).
    retrieveLocale: () => citationLocale,

    // Given an identifier, this retrieves one citation item.  This method
    // must return a valid CSL-JSON object.
    retrieveItem: function (id) {
      return citationItems.find((obj) => obj.id == id)
    }
  }, citationStyle);
}


/**
 * TODO
 */
async function makeEditor() {

  const textarea = document.querySelector('textarea')

  // Create CodeMirror instance from textarea element. Original is replaced.
  editor = CodeMirror.fromTextArea(textarea, config.codeMirror)

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity)

}

/**
 * Load file contents into CodeMirror
 * @param {string} path 
 */
async function loadFile(path) {
  let file = await fse.readFile(path, 'utf8')
  editor.setValue(file)
}



// -------- EVENT FUNCTIONS -------- //

/**
 * Every time cursor updates, check last line it was in for citations. We have to do this, because TODO... (along lines of: citations open/close when they're clicked into and out-of)
 */
function onCursorActivity() {
  lastCursorLine = editor.getCursor().line
  // markCitations()
}




// -------- UTILITY FUNCTIONS -------- //

/**
 * Return array of citatons found in the specified line.
 * For citation, returns an object with the following:
 * ```
 * { line: 5, start: 64, end: 79, id: "book-ValueOfEverything", locatorLabel: "page", locatorValue: "55-57"}
 * ```
 * @param {string} lineHandle - A CodeMirror LineHandle.
 * @return {array} Array of objects, one per citation.
 */
function findCitationsInLine(lineHandle) {

  let citations = []
  const lineNo = lineHandle.lineNo()
  const tokens = editor.getLineTokens(lineNo)

  // Find citations by scanning tokens
  // Save line and start/end characters
  for (const token of tokens) {
    if (token.type !== null && token.type.includes('citation')) {
      switch (token.string) {
        case "[":
          citations.push({ line: lineNo, start: token.start, end: token.end })
          break
        case "]":
          citations[citations.length - 1].end = token.end
          break
      }
    }
  }

  // Use line and start/end characters to get string.
  // From string, extract: id and locator info (value and label).
  citations.map((c) => {

    c.string = editor.getRange({ line: c.line, ch: c.start }, { line: c.line, ch: c.end })
    c.id = getCitationId(c.string)

    let locator = getCitationLocator(c.string, locators)
    c.locatorValue = locator.value
    c.locatorLabel = locator.label
  })

  if (citations.length == 0) return

  return citations
}


/**
 * Find each citation in the specified line, and collape + replace them.
 */
function markCitations() {
  editor.operation(() => {
    editor.eachLine((lineHandle) => {
      let citationsInLine = findCitationsInLine(lineHandle)
      if (citationsInLine) {
        citationsInLine.map((c) => {
          // markText(editor, c)
        })
      }
    })
  })
}

/**
 * TODO
 * @param {*} cite 
 */
function formatCitation(cite) {
  cite = cite.replace(/{{html}}|{{\/html}}/g, '')
  cite = cite.replace(/&#60;/g, '<')
  cite = cite.replace(/&#62;/g, '>')
  return cite
}

/**
 * TODO
 * @param {*} id 
 * @param {*} locatorLabel 
 * @param {*} locatorValue 
 * @param {*} stripWrapper - Remove wrapping span? Default false
 */
function makeHydratedCitation(id, locatorLabel, locatorValue, stripWrapper = false) {

  // Check if id exists
  let idExists = citationItems.some((obj) => obj.id == id)
  if (!idExists) return false

  // Make a citation object. 
  // Per: https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html#citations
  // These are the required inputs for citeproc.processCitationCluster()
  let object = {
    citationItems: [
      {
        id: id
      }
    ],
    properties: {
      noteIndex: 0
    }
  }

  // Add locator info to object, if it was passed in
  if (locatorLabel) object.citationItems[0]["label"] = locatorLabel
  if (locatorValue) object.citationItems[0]["locator"] = locatorValue

  // Get hydrated citation back from citeproc
  let result = citeproc.processCitationCluster(object, [], [])
  // console.log(result)
  if (result) {
    result = result[1][0][1]
  }

  // Clean up the markup
  result = formatCitation(result)

  if (stripWrapper) {
    result = result.substring(result.indexOf('>') + 1, result.lastIndexOf('<'))
  }

  return result
}



/**
 * TODO — NOTE: This will break. It needs `allCitationsOnPage` passed in.
 */
function makeBibliography() {
  // Update citeproc registry with array of all item id's found in page.
  // We have to do this before we makeBibliography()
  let idList = allCitationsOnPage.map((c) => c.citationItems[0].id)
  citeproc.updateItems(idList)

  // Create bibliography
  let bib = citeproc.makeBibliography()
  let bibEntries = bib[1]
  bibEntries.forEach((entry, index, thisArray) => {
    let updatedEntry
    updatedEntry = formatCitation(entry)
    updatedEntry = updatedEntry.replace('<div class="csl-entry">', '')
    updatedEntry = updatedEntry.replace('</div>', '')
    thisArray[index] = updatedEntry
  })
}


async function setup() {

  await setupCitations()
  await makeEditor()
  await loadFile(config.demoFile)
  markCitations()
}

setup()