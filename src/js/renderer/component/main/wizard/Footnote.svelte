<script>
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import InputText from '../../ui/InputText.svelte';
 
  export let cm = null
  export let element = null
  export let suppressWarnings = false

  let content

  $: element, onElementUpdate()

  function onElementUpdate() {
    if (!element) return
    if (element.spans.length) {
      content = element.spans[0]
    } else {
      const index = element.markdown.indexOf('[') + 1 + element.start
      content = { start: index, end: index, string: ''}
    }
  }

</script>

<style type="text/scss"></style>

<header>
  <h1>Footnote</h1>
</header>

<Separator margin={'0'} />

<FormRow margin={'8px 8px'}>
  <InputText
    autofocus={true}
    placeholder={'Required'}
    isError={content.string == '' && !suppressWarnings}
    multiLine={true}
    multiLineMaxHeight={200}
    width={'100%'}
    compact={true} 
    value={content.string}
    on:input={(evt) => writeToDoc(cm, evt.target.textContent, element.line, content.start, content.end)}
  />
</FormRow>