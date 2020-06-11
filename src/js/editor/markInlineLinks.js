import { getTextFromRange, replaceMarkWithElement } from './editor-utils'
import Link from "../component/Link.svelte";

function Details() {
  this.start;
  this.end;
  this.textStart;
  this.textEnd;
  this.text;
  this.urlStart;
  this.urlEnd;
  this.url;
}

/**
 * For the specified line, find links, and for each found, create a new object with their details, push it into an array, and return the array.
 * See Link object (above) for what is included.
 */
function find(editor, lineNo, tokens) {

  let hit
  let hits = []

  // Find open and closing tokens
  for (const token of tokens) {
    if (token.type !== null) {
      if (token.type.includes('link')) {
        switch (token.string) {
          case "[":
            // TODO: Get token at (token.end + 1). If it's '@', then don't create link.
            hit = new Details()
            hit.start = token.start
            hit.textStart = token.start
            hits.push(hit)
            break
          case "]":
            hit.textEnd = token.end
            hit.text = getTextFromRange(editor, lineNo, hit.textStart + 1, hit.textEnd - 1)
            break
        }
      } else if (token.type.includes('url')) {
        switch (token.string) {
          case "(":
            hit.urlStart = token.start
            break
          case ")":
            hit.urlEnd = token.end
            hit.end = token.end
            hit.url = getTextFromRange(editor, lineNo, hit.urlStart + 1, hit.urlEnd - 1)
            break
        }
      }
    }
  }

  // Remove "links" that don't have urls. 
  // Otherwise we can get false positives with `[Hi there]` sections
  // (which I) shouldn't be using in my markdown, to begin with
  hits = hits.filter((h) => h.url !== undefined)

  return hits
}


/**
 * Find and mark links for the given line
 */
export default function markInlineLinks(editor, lineHandle, tokens) {
  const line = lineHandle.lineNo()
  const links = find(editor, line, tokens)
  if (links.length > 0) {
    links.map((l) => {

      const frag = document.createDocumentFragment();

      const component = new Link({
        target: frag,
        props: {
          text: l.text,
          url: l.url
        }
      });

      editor.markText({ line: line, ch: l.start }, { line: line, ch: l.end }, {
        replacedWith: frag,
        // addToHistory: true, // Doesn't do anything?
        clearOnEnter: false,
        inclusiveLeft: false,
        inclusiveRight: false,
        handleMouseEvents: false
      })
    })
  }
}