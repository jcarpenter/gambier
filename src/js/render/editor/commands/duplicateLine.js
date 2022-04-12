import { Pos } from "codemirror"  

/**
 * This is a modified version of https://codemirror.net/keymap/sublime.js
 * Added ability to duplicate line up or down.
 * @param {*} cm 
 * @param {*} direction 
 */
export function duplicateLine(cm, direction) {
  cm.operation(function() {
    var rangeCount = cm.listSelections().length;
    for (var i = 0; i < rangeCount; i++) {
      var range = cm.listSelections()[i];
      switch (direction) {
        case "up":
          cm.replaceRange(cm.getLine(range.head.line) + "\n", Pos(range.head.line + 1, 0));
          break
        case "down":
          cm.replaceRange(cm.getLine(range.head.line) + "\n", Pos(range.head.line, 0));
          break
      }
    }
    cm.scrollIntoView();
  });
}