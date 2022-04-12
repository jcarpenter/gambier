import { cmpPos } from "codemirror"
import { component_subscribe } from "svelte/internal"
import { getModeAndState } from "../editor-utils"
import { getElementAt, getElementsAt, getLineElements, getSpansAt } from "../map"

/**
 * Open URL when user clicks w/ Cmd button held down,
 * if the click happens on a span with a URL.
 * Does not apply to TexMarkers w/ mark replacements
 * (they have own logic for capturing these clicks).
 */
export function wasUrlClicked(cm, pos) {

  const { state, mode } = getModeAndState(cm, pos.line)

  if (mode.name == 'markdown') {

    const tokenType = cm.getTokenTypeAt(pos)
    console.log(pos, tokenType)
    if (!tokenType) return CodeMirror.Pass

    const isLinkUrl = tokenType.includesAll('link', 'url')
    const isBareUrl = tokenType.includes('bare-url')
    const isEmailInBrackets = tokenType.includes('email-in-brackets')
    const isUrlInBrackets = tokenType.includes('url-in-brackets')
    const wasNotFormatting = !tokenType.includes('md')

    const wasUrl = (isLinkUrl || isBareUrl || isEmailInBrackets || isUrlInBrackets) && wasNotFormatting
    if (!wasUrl) return CodeMirror.Pass

    const token = cm.getTokenAt(pos)
    
    if (isLinkUrl || isBareUrl || isUrlInBrackets) {
      window.api.send('openUrlInDefaultBrowser', token.string)
    } else if (isEmailInBrackets) {
      window.api.send('openUrlInDefaultBrowser', `mailto:${token.string}`)
    }
    
  } else if (mode.name == 'yaml') {

    const token = cm.getTokenAt(pos)
    const isTag = token?.type.includes('tag')

    if (isTag) {
      let { anchor, head } = cm.findWordAt(pos)
      let text = cm.getRange(anchor, head)
      // Strip wrapping quotation marks, if present
      // Demo: https://regex101.com/r/0MpP19/1
      if (text.match(/["|'].*?["|']/)) {
        text = text.slice(1, text.length - 1)
      }
      window.api.send('dispatch', {
        type: 'SIDEBAR_SELECT_TAGS',
        tabId: 'tags',
        tags: [text]
      })
      return
    }
  }

  // Else
  return CodeMirror.Pass
}

