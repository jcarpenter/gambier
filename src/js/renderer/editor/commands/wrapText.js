import { Pos } from "codemirror";
import { getElementsInsideRange } from "../map";

/**
 * Wrap `from` `to` range in the selected char
 * Or insert at the cursor position, if isSingleCursor
 * @param {*} cm 
 * @param {*} char 
 * @param {*} from 
 * @param {*} to 
 * @param {*} isSingleCursor 
 */
export function wrapText(cm, char, from, to, isSingleCursor) {

  let selection

  if (isSingleCursor) {
  
    cm.replaceRange(`${char}${char}`, from, from, '+input')
      
    selection = {
      anchor: Pos(from.line, from.ch + char.length), 
      head: Pos(from.line, from.ch + char.length)
    }

  } else {

    const text = cm.getRange(from, to)
    cm.replaceRange(`${char}${text}${char}`, from, to, '+input')

    selection = {
      anchor: Pos(from.line, from.ch + char.length), 
      head: Pos(to.line, to.ch + char.length)
    }

  }

  return selection
}



export function wrapText2(cm, char, from, to, isSingleCursor) {
  const text = isSingleCursor ?
    `${char}${char}` :
    `${char}${cm.getRange(from, to)}${char}`
  return text
}
