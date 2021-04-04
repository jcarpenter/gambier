import { getElementAt, getElementsAt, getSpansAt } from "../map"

/**
 * Open URL when user clicks w/ Cmd button held down,
 * if the click happens on a span with a URL.
 * Does not apply to TexMarkers w/ mark replacements
 * (they have own logic for capturing these clicks).
 */
export function wasUrlClicked(cm, pos) {

  const element = getElementsAt(cm, pos.line, pos.ch)[0]
  if (!element) return CodeMirror.Pass

  switch (element.type) {
    
    case 'link-inline': {
      const spans = getSpansAt(cm, pos.line, pos.ch)
      const clickedOnUrl = spans.some((s) => s.type == 'link inline url')
      if (clickedOnUrl) {
        const url = spans.find((s) => s.type == 'link inline url').string
        window.api.send('openUrlInDefaultBrowser', url)
        return
      }
      break
    }

    case 'bare-url': {
      window.api.send('openUrlInDefaultBrowser', element.markdown)
      return
    }

    case 'email-in-brackets': {
      const url = element.markdown.substring(1, element.markdown.length - 1)
      window.api.send('openUrlInDefaultBrowser', `mailto:${url}`)
      return
    }

    case 'url-in-brackets': {
      const url = element.markdown.substring(1, element.markdown.length - 1)
      window.api.send('openUrlInDefaultBrowser', url)
      return
    }
  }

  // Else
  return CodeMirror.Pass
}

