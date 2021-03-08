<script>
  import { css, setSize } from "./actions";
  import { fade } from 'svelte/transition';
  
  export let maxWidth = '100%'
  export let leftColumn = '' // '100px'
  export let labelTopOffset = '0'
  export let margin = '0'
  export let multiLine = false
  export let compact = false
  
  // Sets flex `align-items` property. 
  // Set to 'stretch' (or 'start') when we want to top-align labels 
  // inside tall multi-line rows.
  // Per: https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
  export let alignItems = 'center' 

  // Optionally define gap between items
  export let gap = '0px'
  
  // Optionally add a label and set its size
  export let label = ''
  export let labelWidth = '46'
  export let labelMargin = '0'
  
  // By adding an outro delay, we enable Expandable components
  // time to animate their closing. It's hacky, but it works.
  // By default it's zero (no delay).
  export let outroDelay = 0
  export let outroDuration = 0

</script>

<style type="text/scss">

  .row {
    display: flex;
    align-items: center;
    max-width: var(--maxWidth);
  }

  .row.multiLine {
    align-items: start;
  }

  .items {
    display: flex;
    gap: var(--gap);
    flex-wrap: nowrap;
    flex-grow: 1;
  }

  .multiLine .items {
    flex-wrap: wrap;
  }
  
  .leftColumn {
    @include label-normal;
    user-select: none;
    flex-basis: var(--leftColumn);
    text-align: right;
    color: var(--labelColor);
    flex-shrink: 0;
    padding-top: var(--labelTopOffset);
    padding-right: 8px; // Always 8px
    overflow: hidden;
    white-space: nowrap;
  }

  .compact .leftColumn {
    @include label-normal-small;
    padding-top: var(--labelTopOffset);
    padding-right: 5px; // Always 5px
  }

  .no-transition {
    animation: none !important;
  }
</style>

<div 
  class="row" 
  use:setSize={{margin}} 
  use:css={{maxWidth, leftColumn, labelTopOffset, gap}}
  class:multiLine
  class:compact
  out:fade|local={{
    duration: outroDuration,
    delay: outroDelay
  }}
>
  {#if leftColumn}
    <span class="leftColumn">
      {label}
    </span>
  {/if}
  <span class="items">
    <slot></slot>
  </span>
</div>