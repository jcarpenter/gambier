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
    min-height: 30px;
    user-select: none;

    h1 {
      @include label-normal;
      color: var(--labelColor);
      font-weight: bold;
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
