<script lang='js'>
  import { setSize } from "./actions";

  export let margin = '0';

</script>

<style lang="scss">
  hr {
    min-height: 1px;
    border: 0;
    background-color: var(--separator-color);
  }
</style>

<hr use:setSize={{margin}} />