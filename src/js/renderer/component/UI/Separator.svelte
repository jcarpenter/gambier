<script>
  import { css } from "./actions";

  export let marginSides = 0;
  export let marginTop = 0;
  export let marginBottom = 0;

</script>

<style type="text/scss">
  hr {
    min-height: 1px;
    border: 0;
    background-color: var(--separatorColor);
    margin: 
      calc(var(--marginTop) * 1px)
      calc(var(--marginSides) * 1px)
      calc(var(--marginBottom) * 1px)
      calc(var(--marginSides) * 1px);
  }
</style>

<hr use:css={{marginSides, marginTop, marginBottom}} />