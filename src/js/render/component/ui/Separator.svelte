<script lang='js'>
  import { setSize } from "./actions";

  export let margin = '0';
  export let color = "separator-color";

</script>

<style lang="scss">
  hr {
    min-height: 1px;
    border: 0;
    background-color: var(--color);
  }
</style>

<hr 
  use:setSize={{margin}} 
  style:--color={`var(--${color})`}
/>