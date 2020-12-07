<script>
  import { setSize } from "./actions";

  export let margin = '0';

</script>

<style type="text/scss">
  hr {
    min-height: 1px;
    border: 0;
    background-color: var(--separatorColor);
  }
</style>

<hr use:setSize={{margin}} />