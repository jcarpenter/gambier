import { getTextFromRange, replaceMarkWithElement } from './editor-utils'
import Citation from "../component/Citation.svelte";

function Details() {
  this.start;
  this.end;
  this.textStart;
  this.textEnd;
  this.text;
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
      if (token.type.includes('citation')) {
        // console.log(token)
        switch (token.string) {
          case "[":
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
      }
    }
  }

  return hits
}


/**
 * Find and mark links for the given line
 */
export default function markCitations(editor, lineHandle, tokens) {
  
  const line = lineHandle.lineNo()
  const citations = find(editor, line, tokens)
  // console.log(citations)
  if (citations.length > 0) {
    citations.map((c) => {

      const frag = document.createDocumentFragment();

      const component = new Citation({
        target: frag,
        props: {
          text: c.text,
        }
      });

      replaceMarkWithElement(editor, frag, line, c.start, c.end)
    })
  }
}