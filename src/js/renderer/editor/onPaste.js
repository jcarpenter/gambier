import TurndownService from "turndown"
import { isUrl } from "../../shared/utils"
import { markDoc } from "./mark"

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

  // TODO: Need to determine if meta, shift or alt keys were pressed.
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

  const isMultipleSelections = cm.listSelections()

  if (isHtml) {
    evt.preventDefault()
    const html = evt.clipboardData.getData('text/html')
    const markdown = turndownService.turndown(html)
    cm.replaceSelection(markdown)
    markDoc(cm) // TODO: Can optimize this...
  } else if (isText) {
    // Do nothing...
  } else if (isFile) {

    // "If the item is a file, the DataTransferItem.getAsFile() method returns the drag data item's File object. If the item is not a file, this method returns null."
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFile
    // const file = item.getAsFile();
    // const fileType = file.types
    window.api.send('saveImageFromClipboard')
  }

  return

  // Target

  const targetText = cm.getRange(change.from, change.to)

  const targetIsSingleCursor =
    change.from.line == change.to.line &&
    change.from.ch == change.to.ch

  const targetIsEmptyLine =
    targetIsSingleCursor &&
    cm.getLine(change.from.line).length == 0

  const targetIsSelection =
    change.from.line !== change.to.line ||
    change.from.ch !== change.to.ch

  const targetIsSingleLineSelection =
    change.from.line == change.to.line &&
    change.from.ch !== change.to.ch

  const targetSelectionIsEntireLine =
    targetIsSingleLineSelection &&
    change.from.ch == 0 &&
    change.to.ch == cm.getLine(change.to.line).length

  const targetIsMultiLineSelection =
    change.from.line !== change.to.line

  // Change

  const changeIsMultipleLines = change.text.length > 1

  const changeIsUrl =
    !changeIsMultipleLines &&
    isUrl(change.text[0])

  const changeIsImageUrl =
    changeIsUrl &&
    change.text[0].match(/\.jpg|\.jpeg|\.gif|\.png$/m)

  if (changeIsImageUrl) {

    // If it's image URL...

    const url = change.text[0]
    if (targetSelectionIsEntireLine) {
      // Create figure. Make selected text the caption.
      change.update(null, null, [`![${targetText}](${url})`])
    } else if (targetIsEmptyLine) {
      // Create figure. Without caption.
      change.update(null, null, [`![](${url})`])
    } else if (targetIsSingleLineSelection) {
      // Create image. Make `change.text` the alt text.
      change.update(null, null, [`![${targetText}](${url})`])
    } else if (targetIsSingleCursor && !targetIsEmptyLine) {
      // Create image. Without alt text.
      change.update(null, null, [`![](${url})`])
    }

  } else if (changeIsUrl) {

    // If it's a non-image URL...

    const url = change.text[0]
    if (targetIsSingleLineSelection) {
      // Create link. Make selected text the alt text.
      change.update(null, null, [`[${targetText}](${url})`])
    }

  } else {

    // If it's not a URL, determine if it's plain text, or HTML...

    // Cancel the change. We're going to do it manually instead.
    change.cancel()

    // Determine format. Returns array.
    const formats = await window.api.invoke('getFormatOfClipboard')
    const isPlainText = formats.length == 1 && formats[0] === 'text/plain'
    const isHTML = formats.includes('text/html')

    if (isPlainText) {

      // Paste plain text
      cm.replaceSelection(change.text.join('\n'))

    } else if (isHTML) {

      // Paste as markdown, converted from HTML
      const html = await window.api.invoke('getHTMLFromClipboard')
      const markdown = turndownService.turndown(html)
      cm.replaceSelection(markdown)

      // If pasted text spans multiple lines, re-mark the doc.
      if (changeIsMultipleLines) {
        markDoc(cm)
      }
    }
  }
}


