<script lang='js'>
  import { setAsCustomPropOnNode, setSize } from "./actions";
  import { fade } from 'svelte/transition';
  // import AddressBar from "../main/AddressBar.svelte";
  // import AllDocuments from "../sidebar/AllDocuments.svelte";
  
  export let maxWidth = '100%'
  export let leftColumn = 'fit-content' // '100px'
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
  export let outroDuration = 0
  export let outroDelay = 0

</script>

<style lang="scss">

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
    align-items: center;
  }

  .multiLine .items {
    flex-wrap: wrap;
  }
  
  .leftColumn {
    @include system-regular-font;
    user-select: none;
    flex-basis: var(--leftColumn);
    min-width: fit-content;
    text-align: right;
    color: var(--label-color);
    flex-shrink: 0;
    padding-top: var(--labelTopOffset);
    padding-right: 8px; // Always 8px
    overflow: hidden;
    white-space: nowrap;
  }

  .compact .leftColumn {
    @include system-small-font;
    padding-top: var(--labelTopOffset);
    padding-right: 5px; // Always 5px
  }

  // TODO: Does not work.
  // .no-transition {
  //   animation: none !important;
  //   transition: none !important;
  // }
</style>


<!-- 
TODO: The only difference between these two is `out:fade`. 
The only way to fully disable `out:fade` is to omit it.
Even if duration is zero, there's still a one frame delay
before it clears. VERY annoying. Seems to be a Svelte issue.
I tried the techniques in this article and they didn't help:
https://geoffrich.net/posts/accessible-svelte-transitions/
Transition delay of zero is supposed to disable to transition
but it doesn't sem to be working. It still there for 1 frame.
-->
{#if outroDuration}

  <div 
    class="row" 
    use:setSize={{margin}} 
    use:setAsCustomPropOnNode={{maxWidth, leftColumn, labelTopOffset, gap}}
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

{:else}

  <div 
    class="row" 
    use:setSize={{margin}} 
    use:setAsCustomPropOnNode={{maxWidth, leftColumn, labelTopOffset, gap}}
    class:multiLine
    class:compact
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

{/if}
