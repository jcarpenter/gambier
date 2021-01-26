/**
 * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change" — https://codemirror.net/doc/manual.html#event_beforeChange
 * Handle paste operations. If URL, generate link; else, if HTML, convert to markdown.
 */
export async function onBeforeChange(cm, change) {

  // If a new doc was loaded, and we don't want to run these operations.
  if (change.origin === 'setValue') {
    return
  }

  // Handle paste operations
  if (change.origin === 'paste') {
    const selection = cm.getSelection()
    const isURL = isUrl(change.text)

    if (isURL) {
      if (selection) {
        const text = selection
        const url = change.text
        const newText = change.text.map(
          (line) => (line = `[${text}](${url})`)
        )
        change.update(null, null, newText)
      }
    } else {
      change.cancel()
      const formats = await window.api.invoke('getFormatOfClipboard')
      if (formats.length === 1 && formats[0] === 'text/plain') {
        cm.replaceSelection(change.text.join('\n'))
      } else if (formats.includes('text/html')) {
        const html = await window.api.invoke('getHTMLFromClipboard')
        const markdown = turndownService.turndown(html)
        cm.replaceSelection(markdown)
      }
    }
  }
}
