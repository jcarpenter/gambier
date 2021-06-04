<script>
  import { state } from "../../StateManager";
  import IconButton from "../ui/IconButton.svelte";

  export let cm
  export let type // 'frontmatter', 'figure', 'fencedcodeblock'
  export let mark = undefined // parent TextMarker

</script>

<style type="text/scss">
  .blockOptions {
    position: absolute;
    // right: 0.35em;
    right: 0;
    top: 50%;
    transform: translate(0, -50%);
    display: flex;
    align-items: center;
  }

  .label {
    @include code-typography;
    letter-spacing: 0;
    font-size: 0.8em;
    line-height: 1em;
    user-select: none;
    cursor: initial;
    text-transform: uppercase;
    font-weight: 500;
    // margin-right: -0.2em; // Squish towards IconButton a bit
  }

  :global(pre.fencedcodeblock .blockOptions)  {
    .label { color: var(--fencedcodeblock-options-label); }
    .iconButton .icon { background: var(--fencedcodeblock-options-label); }
  }
  
  :global(pre.figure .blockOptions)  {
    .label { color: var(--figure-options-label); }
    .iconButton .icon { background: var(--figure-options-icon); }
  }
  

  // Front matter
  
  :global(pre.frontmatter .blockOptions .label)  {
    color: var(--frontmatter-options-label); 
    margin-right: -0.2em; // Squish towards IconButton a bit
  }

  :global(pre.frontmatter .blockOptions .iconButton .icon) { 
    background: var(--frontmatter-options-icon); 
  }


</style>

<svelte:options accessors />

<div class="blockOptions">

  {#if type == 'fencedcodeblock'}

    <span class="label">Code</span>

  {:else if type == 'figure'}

    <span class="label">Figure</span>

  {:else if type == 'frontmatter'}

    <span class="label">Frontmatter</span>
 
    <IconButton 
      icon='block-options-expand-icon' 
      showCaret={false} 
      compact={true}
      iconScale={0.5}
      padding={'0'}
      showBackgroundOnHover={false}
      showBackgroundOnClick={false}
      tooltip={$state.frontMatterCollapsed ? 'Show Front Matter' : 'Hide Front Matter'}
      on:mouseup={() => {
        window.api.send('dispatch', {
          type: 'SET_FRONT_MATTER_COLLAPSED',
          value: !$state.frontMatterCollapsed
        })
      }}
    />
    
  {/if}

</div>
