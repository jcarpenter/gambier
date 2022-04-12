import TurndownService from "turndown"
import { isUrl } from "../../shared/utils"
import { markDoc } from "./mark"

// Turndown options: https://github.com/domchristie/turndown#options
const turndownService = new TurndownService({ 
  headingStyle: 'atx',
  hr: '---'
})

/**
 * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change" — https://codemirror.net/doc/manual.html#event_beforeChange
 * Handle paste operations. If URL, generate link; else, if HTML, convert to markdown.
 */
export async function onBeforeChange(cm, change) {

  // console.log(change)

  // If a new doc was loaded, and we don't want to run these operations.
  // if (change.origin === 'setValue') {
  //   return
  // }

  // On paste:
  // If pasted text is single span (does not contain multiple lines),
  // If text contains selection, replace it.
  // If clipboad contents are a URL, turn selected text into a link or image.
  // Else, if format is plain text, paste as usual.
  // Else, if format is html, convert to Markdown.
  
}

