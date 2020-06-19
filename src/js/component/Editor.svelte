<script>
  export let focused;
</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";
  #editor {
    flex: 1 1 1600px;
    background-color: aliceblue;
    &.focused {
      background-color: red;
    }
  }
</style>

<div id="editor" class:focused on:click>
  <p>Editor</p>
</div>
