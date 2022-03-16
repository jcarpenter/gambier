<script>
  import { state } from "../../StateManager";
  import IconButton from "../ui/IconButton.svelte";   
  // import { Pos } from "codemirror"  

  export let cm // CM instance

</script>

<style type="text/scss">

  // Opacity is set to 1 when parent front matter
  // line is hovered over.

  .collapseButton {
    opacity: 0.75;
    position: absolute;
    left: calc(var(--editor-leftPadding) - 0em);
    // transition: transform 0.2s ease-in-out, opacity 0.1s;
    // z-index: 100;
  }

  .collapseButton:hover {
    opacity: 1;
  }

  .collapseButton.collapsed {
    transform: translate(-100%, 0) rotateZ(-90deg);
  }

  .collapseButton:not(.collapsed) {
    transform: translate(-100%, 0) rotateZ(0deg);
  }

  .collapseButton :global(.iconButton .icon) {
    background: var(--frontmatter-collapsed-widget-hover) !important;
  }
</style>

<svelte:options accessors={true} />

<div 
  class="collapseButton"
  class:collapsed={$state.frontMatterCollapsed}
>

  <IconButton 
    icon='fencedcodeblock-syntax-icon' 
    showCaret={false} 
    compact={true}
    iconScale={0.5}
    padding={'0'}
    tooltip={$state.frontMatterCollapsed ? 'Show Front Matter' : 'Hide Front Matter'}
    on:mouseup={() => {
      window.api.send('dispatch', {
        type: 'SET_FRONT_MATTER_COLLAPSED',
        value: !$state.frontMatterCollapsed
      })
    }}
  />
</div>
