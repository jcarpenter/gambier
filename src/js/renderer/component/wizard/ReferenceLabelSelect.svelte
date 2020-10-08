<script>
    export let target
    export let label
</script>

<style type="text/scss">
  // @import "../../../styles/_variables.scss";
  
</style>

<label for="id" required>{label}</label>
<input
  type="text"
  name="label"
  id="label"
  required
  value={target.label.string}
  on:input={e => handleInput(e.target.value, target.label.start, target.label.end)} />

