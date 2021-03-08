<script>
  export let cm
  export let element

  $: console.log(element)

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
      { line, ch: start + 3 }, 
      { line, ch: start + 4 }
    )
  }
</script>

<style type="text/scss">
</style>

<input 
  class={element.classes.join(' ')} 
  type="checkbox" 
  checked={element.isClosed}
  on:click={toggle} 
/>
