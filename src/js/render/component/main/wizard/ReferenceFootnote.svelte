<script lang='js'>
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc, getReferenceDefinitions } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  
  export let cm = null
  export let element = null
  export let suppressWarnings = false

  let multipleDefinitionsFound = false
  let noDefinitionsFound = false

  let label
  let definition

  $: element, onElementUpdate()

  function onElementUpdate() { 

    if (!element) return

    label = element.spans.find((f) => f.type?.includes('label'))
    
    if (!label) {
      const index = element.start + 2
      label = { start: index, end: index, string: '' }
    }

    const definitions = getReferenceDefinitions(cm, label.string, 'footnote')
    noDefinitionsFound = definitions.length == 0
    multipleDefinitionsFound = definitions.length > 1

    // If there's one match, select it
    // Else set definition null
    definition = definitions.length == 1 ?
      definition = definitions[0].spans.find((s) => s.type.includes('content')).string :
      ''
    
  }

</script>

<style lang="scss"></style>

<header>
  <h1>Reference Footnote</h1>
</header>

<Separator margin={'0 0 8px'} />

<FormRow label={'ID:'} leftColumn={'20px'} margin={'8px'} compact={true}>
  <InputText 
    autofocus={true}
    placeholder={'Required'}
    isError={label.string == '' && !suppressWarnings}
    width={'100%'}
    compact={true} 
    bind:value={label.string} 
    on:input={(evt) => 
      writeToDoc(cm, evt.target.textContent, element.line, label.start, label.end)
    }
  />
</FormRow>

<!------ DEFINITION ------>

<div class="definition">
  {#if noDefinitionsFound}
    <div class="error-message">No definitions for <span class="id">{label.string}</span> found.</div>
  {:else if multipleDefinitionsFound}
    <div class="error-message">Multiple definitions for <span class="id">{label.string}</span> found.</div>
  {:else}
    <FormRow margin={'0'}>   
      <InputText
        multiLine={true}
        multiLineMaxHeight='100'
        editable={false}
        width='100%' 
        compact={true} 
        value={definition}
      />
    </FormRow>
  {/if}
</div>

