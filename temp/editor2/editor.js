import { defaultKeymap } from '@codemirror/commands'
import { lineNumbers } from '@codemirror/gutter'
import { history, historyKeymap } from '@codemirror/history'
import { syntaxTree, ensureSyntaxTree, EditorParseContext } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown'
import { RangeSetBuilder } from '@codemirror/rangeset'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'

import { highlightStyle, theme } from './styles';
import { logTree } from './tests/tests';

let cm // EditorView instance

export async function loadDoc(doc) {
  if (!doc || !cm) return
  const text = await window.api.invoke('getFileByPath', doc.path)
  const length = cm.state.doc.length
  const transaction = cm.state.update({
    changes: { from: 0, to: length, insert: text}
  })
  cm.dispatch(transaction)
}

export function init(initialDocText, parentElement) {

  cm = new EditorView({
    state: EditorState.create({
      doc: initialDocText,
      lineWrapping: true,
      extensions: [
        // tagBlockQuotes,
        // plugin,
        theme(),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping, // Sets `white-space` to `pre-wrap` on cm-content
        history(),
        markdown(),
        highlightStyle,
        // lineNumbers(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap
        ]),
      ],
    }),
    parent: parentElement
  })

  logTree(cm)
}