<script>
  import { isWindowFocused } from "../../StateManager";

</script>

<style type="text/scss">
  
  .window-frame {
    -webkit-app-region: drag;
    user-select: none;
    border-width: 0 0 1px;
    border-style: solid;
    @include dark { border-color: var(--shadowColor); }
    @include light { border-color: var(--separatorColor); }
  }

  .window-frame.isWindowFocused {
    @include dark { 
      background-color: var(--windowBackgroundColor);
    }
    @include light {
      background: 
        linear-gradient(white(0.1), white(0.1)),
        var(--windowBackgroundColor);
    }

  }

  .window-frame:not(.isWindowFocused) {
    @include dark { 
      background: 
        linear-gradient(black(0.25), black(0.25)),
        var(--windowBackgroundColor);
    }
    @include light {
      background: 
        linear-gradient(black(0.02), black(0.02)),
        var(--windowBackgroundColor);
    }
  }
</style>

<div class="window-frame" class:isWindowFocused={$isWindowFocused}>
  <slot></slot>
</div>