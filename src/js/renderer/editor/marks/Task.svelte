<script>
  import { Pos } from "codemirror";
  import { getElementAt } from "../map";

  export let cm
  export let textMarker = null

  let element // This line element (per getLineElements)
  let el // This dom element
  let isClosed = false
  let isHighlighted = false

  $: textMarker, update()

  /**
   * Determine if task is open or closed.
   * Called on initial setup, once textMarker is set,
   * and whenever `onChanges` handler detects a change
   * has effected textMarker.
  */
  export async function update() {
    if (!textMarker) return

    const { from, to } = textMarker.find()
    element = getElementAt(cm, from.line, from.ch + 1)
    isClosed = element.markdown.includes('x')
  }

  export function onSelectionChange(origin, ranges) {
    // Do nothing
  }

  /**
   * Set CM selection to this mark.
   */
  export function altTabTo() {
    const { line, start, end } = element
    cm.setSelection({ line, ch: end }, { line, ch: start })
  }

  function toggle() {
    const { isClosed, line, start, end } = element
    
    cm.replaceRange(
      isClosed ? ' ' : 'x', 
      Pos(line, start + 3),
      Pos(line, start + 4)
    )
  }

</script>

<style type="text/scss">
</style>

<svelte:options accessors={true}/>

<span>
  
</span>
<input 
  class={element?.classes.join(' ')} 
  type="checkbox" 
  checked={isClosed}
  on:click={toggle} 
/>
