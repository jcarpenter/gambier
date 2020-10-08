<script>
  export let doc = null;
  export let element = null;

  let title = "";

  /**
   * Write input value to doc.
   */
  function handleInput(value, start, end) {
    doc.replaceRange(
      value,
      { line: element.line, ch: start },
      { line: element.line, ch: end }
    );
  }
</script>

<h1>Footnote</h1>
<textarea
  type="text"
  name="text"
  id="text"
  required
  value={element.content.string}
  on:input={e => handleInput(e.target.value, element.content.start, element.content.end)} />