<script>
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import InputText from '../../ui/InputText.svelte';
 
  export let cm = null
  export let element = null

  let content

  $: {
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
    placeholder={''}
    multiLine={true}
    multiLineMaxHeight={200}
    width={'100%'}
    compact={true} 
    bind:value={content.string} 
    on:input={(evt) => 
      writeToDoc(
        cm, evt.target.textContent, 
        element.line, content.start, content.end
      )
    }
  />
  </FormRow>