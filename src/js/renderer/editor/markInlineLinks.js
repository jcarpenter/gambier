import { getTextFromRange, replaceMarkWithElement } from './editor-utils'
import Link from "../component/Link.svelte";
import { text } from 'svelte/internal';

function Details() {
  this.start;
  this.end;
  this.textStart;
  this.textEnd;
  this.text;
  this.urlStart;
  this.urlEnd;
  this.url;
  this.titleStart;
  this.titleEnd;
  this.title;
}

/**
 * For the specified line, find links, and for each found, create a new object with their details, push it into an array, and return the array.
 * See Link object (above) for what is included.
 */
function find(editor, lineNo, tokens) {

  let state = {}
  let hit
  let hits = []

  // Find open and closing tokens
  tokens.forEach((t, index) => {

    if (t.type !== null) {
      if (t.type.includes('link')) {

        const prevToken = tokens[index -1]
        const nextToken = tokens[index + 1]

        if (!prevToken.type.includes('link')) {
          // console.log("New link found", index)
          hit = new Details()
          hit.start = t.start
          hit.textStart = t.start
          hits.push(hit)
        } else if (t.type.includes('url')) {
          if (!prevToken.type.includes('url')) {
            hit.textEnd = t.start
            hit.text = getTextFromRange(editor, lineNo, hit.textStart + 1, hit.textEnd - 1)
            hit.urlStart = t.end
          } else if (!nextToken.type.includes('url')) {
            hit.urlEnd = t.end
            hit.url = getTextFromRange(editor, lineNo, hit.urlStart, hit.urlEnd)
          }
        } else if (t.type.includes('title')) {
          if (!prevToken.type.includes('title')) {
            hit.titleStart = t.end
          } else if (nextToken == undefined || !nextToken.type.includes('title')) {
            hit.titleEnd = t.start
            hit.title = getTextFromRange(editor, lineNo, hit.titleStart + 1, hit.titleEnd - 1)
          }
        } else if (nextToken == undefined || !nextToken.type.includes('link')) {
          // console.log("End of link found", index)
          hit.end = t.end
        }

        // if (t.type.includes('text')) {
        //   switch (t.string) {
        //     case "[":
        //       // TODO: Get token at (t.end + 1). If it's '@', then don't create link.
        //       hit = new Details()
        //       hit.start = t.start
        //       hit.textStart = t.start
        //       hits.push(hit)
        //       break
        //     case "]":
        //       hit.textEnd = t.end
        //       hit.text = getTextFromRange(editor, lineNo, hit.textStart + 1, hit.textEnd - 1)
        //       break
        //   }
        // } else if (t.type.includes('url')) {
        //   switch (t.string) {
        //     case "(":
        //       hit.urlStart = t.start
        //       break
        //     case ")":
        //       hit.urlEnd = t.end
        //       hit.end = t.end
        //       hit.url = getTextFromRange(editor, lineNo, hit.urlStart + 1, hit.urlEnd - 1)
        //       break
        //   }
        // }
      }
    }
  })

  // console.log(hit)

  // Remove "links" that don't have urls. 
  // Otherwise we can get false positives with `[Hi there]` sections
  // (which I) shouldn't be using in my markdown, to begin with
  // hits = hits.filter((h) => h.url !== undefined)

  return hits
}

// function testFind(editor, lineHandle, tokens) {
//   let textStart, textEnd, urlStart, urlEnd, titleStart, titleEnd = 0

//   const textStyles = lineHandle.styles
//   textStyles.forEach((s, index) => {
//     if (typeof s === 'string' && s.includes('link')) {
//       if (s.includes('title') && textStart == 0) {
//         textStart = textStyles[index - 1]
//       }
//     }
//   })
// }

/**
 * Find and mark links for the given line
 */
export default function markInlineLinks(editor, lineHandle, tokens) {
  // console.log(lineHandle)
  // console.log(editor.getLineTokens(lineHandle.lineNo()))
  const line = lineHandle.lineNo()
  const links = find(editor, line, tokens)
  console.log(links)

  // if (links.length > 0) {
  //   links.map((l) => {

  //     const frag = document.createDocumentFragment();

  //     const component = new Link({
  //       target: frag,
  //       props: {
  //         text: l.text,
  //         url: l.url
  //       }
  //     });

  //     editor.markText({ line: line, ch: l.start }, { line: line, ch: l.end }, {
  //       replacedWith: frag,
  //       // addToHistory: true, // Doesn't do anything?
  //       clearOnEnter: false,
  //       inclusiveLeft: false,
  //       inclusiveRight: false,
  //       handleMouseEvents: false
  //     })
  //   })
  // }
}