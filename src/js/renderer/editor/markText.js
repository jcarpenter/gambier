/**
* TODO
* @param {string} citation - Citation object containing string, line, ch's, locator, etc. 
*/

const badIdMessage = 'Citation not found. Check id.'

function makeReplacement() {

}

function hydrateCitation() {

}



/*

// State object {}
openingValue - Set on open
setValue - set on Enter
currentValue(): () => input.textContent
Bad id? True

// Update state (event listener callbacks)


// Update view (watch state object for changes)
Same as opening = unmodified
- Hide instructions

Current different from set value
- Show instructions. 
- Show 'Enter to update' line
- Hide 'Enter to save' line

Current same as set value
- Show instructions
- Hide 'Enter to update' line
- Show 'Enter to save' line

Set value different from opening = edited
- Show instructions
- Show 'Enter to save' line
- Save on close


if (currentValue !== savedValue) {
  replacement.setAttribute('data-state', 'edited')
} else {

}

- currentValue !== savedValue ? state = edited
  - currentValue !== openingValue ? state = 

On open popup: 
- originalValue = savedValue = currentValue
 
On keyup: 
  isEdited: popup.classList.add('edited)
- currentValue == onOpen
  popup.classList.remove('edited)
 
On enter:
- isEdited? update() : close()
  - update(): 
    Get citation. 
    savedValue = Current value.

On esc:
- close()
  currentValue = savedValue
  originalValue == savedValue ? update() : 
    - update
      replaceRange
      markText
*/

let State = {
  edited: false
}

let Store = {
  getState: () => State,
  // subscribe: 
}

let currentValue

function handleChange() {
  let previousValue = currentValue
  currentValue = Store.getState().edited
  console.log("Changed!")
}

module.exports = (editor, citation) => {

  console.log(Store.getState().edited)
  // Store.subscribe(handleChange)



  // return

  let line = citation.line
  let start = citation.start
  let end = citation.end

  // Before: [@web-glaciers, p. 22]
  // After: web-glaciers, p. 22 
  let string = citation.string.substring(2, citation.string.length - 1)

  /*
  // If cursor is inside the element, don't markText
  const cursor = editor.getCursor()
  // console.log("---------")
  // console.log(cursor.line, line)
  // console.log(cursor.ch, start)
  // console.log(cursor.ch, end)
  if (cursor.line == line && cursor.ch > start && cursor.ch < end) {
    console.log("cursor is inline")
    return
  }
  */

  // Get elements
  let replacement = document.querySelector('body > .cm-citation-collapsed').cloneNode(true)
  let popup = replacement.querySelector('.popup')
  let instructions = replacement.querySelector('.instructions')
  let wrapper = replacement.querySelector('.wrapper')
  let input = replacement.querySelector('.input')
  let tooltip = replacement.querySelector('.tooltip')
  let button = replacement.querySelector('button.icon')

  // Hydrate citation
  let citationHtml = makeHydratedCitation(citation.id, citation.locatorLabel, citation.locatorValue, true)
  if (citationHtml) {
    wrapper.innerHTML = citationHtml
  } else {
    wrapper.innerHTML = badIdMessage
  }

  // Populate input field
  input.textContent = string

  // inclusiveLeft/Right = false is great!
  // Lets us select and copy/paste the `fn` text
  // Behind the scenes, it's grabbing the original text.
  // If, for example, I paste into diff doc, it pastes the expanded text
  // (with citekey)
  let textMarker = editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    replacedWith: replacement,
    clearOnEnter: false,
    inclusiveLeft: false,
    inclusiveRight: false,
    handleMouseEvents: false
  })

  // Create state object
  let inputText = {
    onOpen: string,
    current: () => input.textContent,
    saved: string
  }

  // Prevent default on mouse down, or button gets focus.
  button.addEventListener('mousedown', (e) => {
    e.preventDefault()
  })

  // Open
  button.addEventListener("click", (e) => {
    e.preventDefault()

    inputText.onOpen = inputText.saved = inputText.current()

    // Focus input
    input.focus()

    // Select input text
    const range = document.createRange();
    range.selectNodeContents(input);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  })

  // Close
  popup.addEventListener('focusout', (e) => {
    if (!popup.contains(e.relatedTarget)) {
      if (editedAndSaved) {
        editor.replaceRange(string, { line: line, ch: start }, { line: line, ch: end })
        let citationsInLine = findCitationsInLine(lineHandle)
        if (citationsInLine) {
          citationsInLine.map((c) => {
            markText(c)
          })
        }
      } else if (edited && !editedAndSaved) {
        input.textContent = originalValue
      }
      popup.setAttribute('data-state', '')
    }
  })

  // Keydown
  popup.addEventListener('keydown', (e) => {

    const key = e.key

    if (key === 'Escape') {
      button.focus()
      button.blur()
    } else if (key === 'Enter') {
      e.preventDefault()

      // If text has changed since last save, update citation
      if (inputText.current() !== inputText.saved) {

        // Update `saved` value
        inputText.saved = inputText.current()

        // Add `saved` class to popup


        // Extract citation paramaters from input value
        let string = `[@${input.textContent}]`
        let id = getCitationId(string)
        let locator = getCitationLocator(`${input.textContent}]`, locators)
        let label = locator ? locator.label : ''
        let value = locator ? locator.value : ''

        // Get hydrated citation
        let newCitation = makeHydratedCitation(id, label, value, true)

        // If citation is good, insert into wrapper.
        // Else, display error message.
        if (newCitation) {
          wrapper.innerHTML = newCitation
          replacement.setAttribute('data-badId', '')
        } else {
          wrapper.innerHTML = badIdMessage
          replacement.setAttribute('data-badId', 'true')
        }
      }
    }
  })

  // Key up
  popup.addEventListener('keyup', (e) => {

    if (inputText.current() !== inputText.saved) {
      replacement.setAttribute('data-state', 'edited')
      // Show "update" prompt in instructions
      instructions.querySelector('.update').classList.remove('hidden')
    } else if (inputText.current() == inputText.onOpen) {
      replacement.setAttribute('data-state', '')
    }
  })
}