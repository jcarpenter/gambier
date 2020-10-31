<script>
  export let marginSides = '0';
</script>

<style type="text/scss">
  hr {
    min-height: 1px;
    border: 0;
    background-color: var(--separatorColor);

    &.full {
      margin: 0;
    }

    &.nested {
      margin: 0 10px;
    }
  }
</style>

<hr style="margin: 0 {marginSides}px" />