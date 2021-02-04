<script>
  import { isWindowFocused } from "../../StateManager";

</script>

<style type="text/scss">
  
  .window-frame {
    -webkit-app-region: drag;
    user-select: none;
    border-width: 0 0 1px;
    border-style: solid;
    background-color: var(--windowBackgroundColor);
    @include dark { border-color: var(--shadowColor); }
    @include light { border-color: var(--separatorColor); }
  }

  // Darken when not focused
  .window-frame:not(.isWindowFocused) {
    @include dark { filter: brightness(0.75); }
    @include light { filter: brightness(0.98); }
  }
</style>

<div class="window-frame" class:isWindowFocused={$isWindowFocused}>
  <slot></slot>
</div>