<script>
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc, getReferenceDefinitions } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  
  export let cm = null
  export let element = null

  let multipleDefinitionsFound = false
  let noDefinitionsFound = false

  let label
  let definition

  $: { 

    label = element.spans.find((f) => f.type.includes('label'))
    
    // if (!label) {
    //   const index = isFull ? 
    //     element.markdown.indexOf('][') + 2 + element.start :
    //     element.start + 1
    //   label = { start: index, end: index, string: '' }
    // }

    if (element) {
      const definitions = getReferenceDefinitions(cm, label.string, 'footnote')

      noDefinitionsFound = definitions.length == 0
      multipleDefinitionsFound = definitions.length > 1

      console.log(noDefinitionsFound, multipleDefinitionsFound)

      // If there's one match, select it
      // Else set definition null
      definition = definitions.length == 1 ?
        definition = definitions[0].spans.find((s) => s.type.includes('content')).string :
        ''
    }
  }

</script>

<style type="text/scss"></style>

<header>
  <h1>Reference Footnote</h1>
</header>

<Separator margin={'0 0 8px'} />

<FormRow label={'ID:'} leftColumn={'20px'} margin={'8px'} compact={true}>
  <InputText 
    width='100%' 
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
        bind:value={definition} 
      />
    </FormRow>
  {/if}
</div>

