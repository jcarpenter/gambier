<script>
  import { isWindowFocused } from "../../StateManager";
  export let title = ''
</script>

<style type="text/scss">
  header {
    @include system-regular-font;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    height: 28px;
    @include dark {
      color: var(--label-2-color);
    }
    @include light {
      color: var(--label-color);
    }
  }

  header.isWindowFocused {
    @include dark {
      opacity: 1;
    }
    @include light {
      opacity: 0.85;
    }
  }

  header:not(.isWindowFocused) {
    @include dark {
      opacity: 0.5;
    }
    @include light {
      opacity: 0.35;
    }
  }
</style>

<header class:isWindowFocused={$isWindowFocused}>
  {title}
</header>