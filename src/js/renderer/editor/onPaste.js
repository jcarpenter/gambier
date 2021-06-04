import TurndownService from "turndown"
import { isImagePath, isUrl, isValidHttpUrl } from "../../shared/utils"
import { getFromAndTo, writeMultipleEdits } from "./editor-utils"
import { getElementAt } from "./map"
import { markDoc, markElement } from "./mark"

// Turndown options: https://github.com/domchristie/turndown#options
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---'
})

export async function onPaste(cm, evt) {

  console.log('onPaste')
  // console.log(cm.getMode('text/html'))
  // cm.setOption("mode", $(this).val() )

  // Ignore the paste if CM is not focused.
  // If we don't do this, CM takes paste events from Wizard.
  if (!cm.hasFocus()) {
    evt.codemirrorIgnore = true
    return
  }

  if (cm.state.pasteAsPlainText) {
    evt.preventDefault()
    const text = evt.clipboardData.getData('text/plain')
    cm.replaceSelection(text)
    cm.state.pasteAsPlainText = false
    return
  }

  // Paste unformatted text: ["text/plain"]
  // Paste URL: ["text/plain"]
  // Paste HTML: ["text/plain", "text/html"]
  // Paste from Notes app: ["text/plain", "text/html", "text/rtf"]
  // Paste image from clipboard: ["Files"]
  // Paste image from browser: ["text/html", "Files"]
  // Paste file from OS: ["text/plain", "Files"]

  const types = evt.clipboardData.types
  const item = evt.clipboardData.items[0]

  const isHtml = types.includes('text/html')
  const isText = types.includes('text/plain') && !isHtml
  const isFile = types.includes('Files')

  if (isHtml) {

    // Convert HTML to markdown and paste
    evt.preventDefault()

    const html = evt.clipboardData.getData('text/html')
    const markdown = turndownService.turndown(html)
    cm.replaceSelection(markdown)
    markDoc(cm) // TODO: Can optimize this...

  } else if (isFile) {

    // "If the item is a file, the DataTransferItem.getAsFile() method returns the drag data item's File object. If the item is not a file, this method returns null."
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFile
    // const file = item.getAsFile();
    // const fileType = file.types
    console.log('isFile')
    window.api.send('saveImageFromClipboard')

  }

  // Else, proceed to process as plain text...

  const clipboardText = evt.clipboardData.getData('text/plain')
  const isUrl = isValidHttpUrl(clipboardText)

  // If pasted text is a URL, and there's text selected
  // convert the selected text into an inline link or image.
  // Else paste as bare URL.

  if (isUrl) {

    evt.preventDefault()

    let edits = []
    const isImage = isImagePath(clipboardText)
    const ranges = cm.listSelections()

    ranges.forEach((range) => {

      const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(range)
      const isSelectedTextInsideAnotherElement =
        !isSingleCursor &&
        getElementAt(cm, from.line, from.ch) !== undefined

      if (isSingleCursor || isSelectedTextInsideAnotherElement) {
        // Paste as bare url
        edits.push({ text: clipboardText, from, to, select: { type: 'end' }})
      } else {
        // Paste url inside new link or image
        const selectedText = cm.getRange(from, to)
        let newLinkOrImage = `[${selectedText}](${clipboardText})`
        if (isImage) newLinkOrImage = `!${newLinkOrImage}`
        edits.push({ text: newLinkOrImage, from, to, select: { type: 'end' } })
      }
    })

    writeMultipleEdits(cm, edits)
    return
  }
}


