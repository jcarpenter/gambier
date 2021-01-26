import { RangeSetBuilder } from '@codemirror/rangeset'

import { EditorView, DecorationSet, ViewPlugin, ViewUpdate, Decoration } from '@codemirror/view'

function getDecorations(view: EditorView) {

    // Go through line by line
    // 

    let builder = new RangeSetBuilder<Decoration>()
    builder.add(0, 100, Decoration.mark({ class: "highlight" }))
    return builder.finish()
}


// NOTE: I need to do a field declaration, but it's not a widely supported feature yet. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#field_declarations
// Write this in a separate JS file? Hopefully just works. Else, write in TS? Or in JS, and transpile with Babel?
export const tagBlockQuotes = ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
        this.decorations = getDecorations(view)
    }

    update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) {
            console.log('Hi')
            this.decorations = getDecorations(u.view)
        }
    }
}, {
    decorations: v => v.decorations
})



