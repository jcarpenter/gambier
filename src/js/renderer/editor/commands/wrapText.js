export function wrapText(cm, char) {

  const sels = cm.getSelections()
  for (var i = 0; i < sels.length; i++)
    sels[i] = char + sels[i] + char;
  // sels.forEach((s) => s = 'Texican')
  cm.replaceSelections(sels, "around");
  // sels = cm.listSelections().slice();
}
