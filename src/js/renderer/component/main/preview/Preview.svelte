<script>

  export let cm = null
  export let element = null
  export let el = null // DOM element, set with bind:this

  let isVisible = false

  /**
   * Show wizard by toggling 'isVisible' class, and setting `top` and `left` positions.
   */
  export async function show(newElement) {

    element = newElement

    // Update position
    // Docs: https://codemirror.net/doc/manual.html#charCoords
    const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
    leftPos = `${
      cm.cursorCoords(true, 'local').left + paddingOnLeftSideOfEditor
    }px`
    topPos = `${cm.cursorCoords(true, 'local').bottom + 10}px`

    // Autoscroll to ensure wizard is visible. We need to call this manually, AFTER the wizard has repositioned itself (using `tick`), so autoscroll takes the wizard element into account. Otherwise it either doesn't fire, or fires too early (e.g. when the selection was set that triggered the wizard opening)
    await tick()
    cm.scrollIntoView(null)

    // Error
    // isError = target.error

    // Make visible
    isVisible = true

    // Focus
    el.focus()
  }

  /**
  * Hide wizard by toggling `isVisible` class and positioning off-screen.
  */
  function hide() {
    isVisible = false
    // Reset to default values
    leftPos = '-5000px'
    topPos = '0px'
  }

</script>

<style type="text/scss">
  #preview {
    // width: 20em;
    // height: 20em;
    // background: rgba(200, 200, 100, 0.5);
    // position: absolute;
    // left: 0;
    // top: 70em;
  }
</style>

<svelte:options accessors={true} />
<div 
  id="preview"
  bind:this={el}
  class:visible={isVisible}
  tabindex="-1"
>

</div>