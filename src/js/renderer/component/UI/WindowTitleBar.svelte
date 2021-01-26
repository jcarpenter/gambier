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
    @media (prefers-color-scheme: dark) { 
      color: var(--secondaryLabelColor);
    }
    @media (prefers-color-scheme: light) {
      color: var(--labelColor);
    }
  }

  header.isWindowFocused {
    @media (prefers-color-scheme: dark) { 
      opacity: 1;
    }
    @media (prefers-color-scheme: light) {
      opacity: 0.85;
    }
  }

  header:not(.isWindowFocused) {
    @media (prefers-color-scheme: dark) { 
      opacity: 0.5;
    }
    @media (prefers-color-scheme: light) {
      opacity: 0.35;
    }
  }
</style>

<header class:isWindowFocused={$isWindowFocused}>{title}</header>