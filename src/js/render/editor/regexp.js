// https://regex101.com/r/YRtKTX/1
export const headerStartRE = /^#+\s*/

export const ulLineStartRE = /^(\s*?)(\*|\-|\+)(\s*)/

export const olLineStartRE = /^(\s*?)(\d)(\.|\))(\s*)/

export const taskListStartRE = /^(.*?)(\[[x ]\]\s+)/

// https://regex101.com/r/wB4TkL/2
// Find start of list. `ul` or `ol`. 
// And task list, if present.
export const listStartRE = /^(\s*)([*\-+]\s+|[0-9]+([.)])\s+)(\[[x ]\]\s+)?/

export const blankLineRE = /^\s*$/

// https://regex101.com/r/HyoEdW/1/
export const blockQuoteStartRE = /\s*>\s+/