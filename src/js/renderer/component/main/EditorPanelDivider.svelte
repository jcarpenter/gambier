
<script lang='js'>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let enabled = true

  let dragging = false

  function setWidth(domEvent) {
    dispatch('resize', { 
      domEvent: domEvent, 
    })
  }

  function resize(domEvent) {
    dragging = true;
    window.addEventListener('mouseup', resizeEnd, false);
    window.addEventListener('mousemove', setWidth, false);
  }

  function resizeEnd() {
    dragging = false;
    window.removeEventListener('mouseup', resizeEnd, false);
    window.removeEventListener('mousemove', setWidth, false);
    dispatch('resizeend')
  }

</script>

<style lang="scss">='text/scss'>
  .divider {
    height: 100%;
    width: 10px;
    // background: var(--separator-color);
    position: relative;
  }
  
  .dragTarget {
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 100%;
    z-index: 10;
    // background: red;
  }

  .divider:not(.enabled) {
    pointer-events: none;
  }

  .dragTarget:hover,
  .dragTarget.dragging {
    cursor: col-resize;
  }
</style>

<div 
  class='divider' 
  class:enabled
>
  <div 
    class='dragTarget'
    class:dragging
    on:mousedown|preventDefault={resize}
    on:dblclick
  />
</div>