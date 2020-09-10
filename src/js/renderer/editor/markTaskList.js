/**
 * Find and replace task list `[ ]` and `[x]` sequences with checkbox elements.
 */
export default async function markTaskList(editor, lineHandle, tokens) {
  
  const line = lineHandle.lineNo()
  const start = lineHandle.text.indexOf('[')
  const end = lineHandle.text.indexOf(']') + 1

  const frag = document.createDocumentFragment()
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox'
  checkbox.checked = lineHandle.text.charAt(start + 1) == 'x'
  checkbox.addEventListener('click', (e) => {
    const string = checkbox.checked ? '[x]' : '[ ]'
    editor.replaceRange(string, { line: line, ch: start }, { line: line, ch: end })
  })
  frag.appendChild(checkbox)

  editor.markText({ line: line, ch: start}, { line: line, ch: end }, {
    replacedWith: frag,
    clearOnEnter: false,
    selectLeft: false,
    selectRight: true,
    handleMouseEvents: false
  })
}