import { Pos } from "codemirror"  

export function duplicateLine(cm, direction) {
  cm.operation(function() {
    var rangeCount = cm.listSelections().length;
    for (var i = 0; i < rangeCount; i++) {
      var range = cm.listSelections()[i];
      switch (direction) {
        case "up":
          console.log(range)
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