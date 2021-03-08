<script>
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import InputText from '../../ui/InputText.svelte';
 
  export let cm = null
  export let element = null

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
    bind:value={element.content.string} 
    on:input={(evt) => 
      writeToDoc(
        cm, evt.target.textContent, 
        element.line, element.content.start, element.content.end
      )
    }
  />
  </FormRow>