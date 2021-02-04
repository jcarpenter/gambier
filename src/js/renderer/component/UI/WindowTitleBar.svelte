<script>
  import { isWindowFocused } from "../../StateManager";
  export let title = ''
</script>

<style type="text/scss">
  header {
    @include label-normal-bold;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    height: 28px;
    @include dark {
      color: var(--secondaryLabelColor);
    }
    @include light {
      color: var(--labelColor);
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