<script lang='js'>
  import { state } from "../../StateManager";
</script>

<style lang="scss">
  #grid {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    pointer-events: none;
    background: 
      // 4px cels
      linear-gradient(black(0.05) 1px, transparent 1px),
      linear-gradient(-90deg, black(0.05) 1px, transparent 1px),
      // 12px cels
      linear-gradient(black(0.05) 1px, transparent 1px),
      linear-gradient(-90deg, black(0.05) 1px, transparent 1px),
      // color
      rgba(40, 160, 200, 0.1);
    background-size: 
      4px 4px, 
      4px 4px, 
      12px 12px,
      12px 12px;
  }
</style>


{#if $state.developer.showGrid}
  <div id="grid"></div>
{/if}