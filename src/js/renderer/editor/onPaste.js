import TurndownService from "turndown"
import { isImagePath, isUrl, isValidHttpUrl } from "../../shared/utils"
import { getFromAndTo } from "./editor-utils"
import { getElementAt } from "./map"
import { markDoc, markElement } from "./mark"

// Turndown options: https://github.com/domchristie/turndown#options
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---'
})

export async function onPaste(cm, evt) {

  // console.log('onPaste')
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
    const string = evt.clipboardData.getData('text/plain')
    cm.operation(() => {
      const selections = cm.listSelections()
      selections.forEach((s) => {
        const { from, to } = getFromAndTo(s)
        cm.replaceRange(string, from, to)
      })
    })
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
    window.api.send('saveImageFromClipboard')

  }

  // Else, proceed to process as plain text...

  const string = evt.clipboardData.getData('text/plain')
  const isUrl = isValidHttpUrl(string)

  // If pasted text is a URL, and there's text selected
  // convert the selected text into an inline link.
  // Else paste as bare URL.

  if (isUrl) {

    const isImage = isImagePath(string)
    const selections = cm.listSelections()

    cm.operation(() => {

      // For each active selection, paste as bare url
      // if there's no text selected, or if the selected
      // text is inside another element.
      // Else, paste url as link or image.

      selections.forEach((s) => {

        const { from, to } = getFromAndTo(s)
        const isSingleCursor = from.line == to.line && from.ch == to.ch
        const isSelectedTextInsideAnotherElement =
          !isSingleCursor &&
          getElementAt(cm, from.line, from.ch) !== undefined

        if (isSingleCursor || isSelectedTextInsideAnotherElement) {
          // Paste as bare url
          cm.replaceRange(string, from, to)
        } else {
          // Paste url inside new link or image
          const text = cm.getRange(from, to)
          let newLinkOrImage = `[${text}](${string})`
          if (isImage) newLinkOrImage = `!${newLinkOrImage}`
          cm.replaceRange(newLinkOrImage, from, to)
        }
      })
    })

    evt.preventDefault()
    return
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


