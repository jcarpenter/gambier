<script>
  export let title = 'Title'
  export let hoverToShowSlot = false
</script>

<style type="text/scss">
  header {
    padding: 0 10px;
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    height: 30px;
    flex: none;
    user-select: none;

    h1 {
      @include label-normal-bold;
      color: var(--labelColor);
      flex-grow: 1;
      margin: 0;
      padding: 0;
    }
  }

  // We use this class to (optionally) hide the slot contens until the user hovers.
  .hoverToShowSlot {
    .slot { visibility: hidden; };
  }

  .hoverToShowSlot:hover,
  .hoverToShowSlot:focus-within {
    .slot { visibility: visible; };
  }
  
</style>

<header class={hoverToShowSlot ? 'hoverToShowSlot' : ''}>
  <h1>{title}</h1>
  <div class="slot">
    <slot></slot>
  </div>
</header>
