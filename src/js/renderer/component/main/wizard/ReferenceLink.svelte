<script>
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc, getReferenceDefinitions } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';

  export let cm = null
  export let element = null

  let isFull = false
  let isCollapsed = false
  let multipleDefinitionsFound = false
  let noDefinitionsFound = false

  let label  
  let text
  let definitionUrl
  let definitionTitle
  
  $: { 

    isFull = element.type.includes('full')
    isCollapsed = element.type.includes('collapsed')

    // Get `label`
    // Full reference links: `[text][label]`
    // Collapsed reference links: `[label][]`
    
    label = element.spans.find((f) => f.type.includes('label'))
    
    if (!label) {
      const index = isFull ? 
        element.markdown.indexOf('][') + 2 + element.start :
        element.start + 1
      label = { start: index, end: index, string: '' }
    }

    // Get `text`, if element is a full reference link.
    // E.g. `[text][label]`
    if (isFull) {
      text = element.spans.find((f) => f.type.includes('text'))
      if (!text) {
        text = { start: element.start + 1, end: element.start + 1, string: '' }
      }
    }

    if (label.string !== '') {
      const definitions = getReferenceDefinitions(cm, label.string, 'link')
      
      noDefinitionsFound = definitions.length == 0
      multipleDefinitionsFound = definitions.length > 1

      // If there's one match, select it
      // Else set definition null
      if (definitions.length == 1) {
        definitionUrl = definitions[0].spans.find((s) => s.type.includes('url'))?.string
        definitionTitle = definitions[0].spans.find((s) => s.type.includes('title'))?.string
      } else {
        definitionUrl = undefined
        definitionTitle = undefined
      }
    }
  }

</script>

<style type="text/scss"></style>

<header>
  <h1>Reference Link</h1>
</header>

<Separator margin={'0 0 8px'} />

{#if isFull }
  
  <!------ FULL ------>

  <FormRow label={'Text:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      multiLine={true}
      multiLineMaxHeight='200'
      width='100%' 
      compact={true} 
      bind:value={text.string} 
      on:input={(evt) => 
        writeToDoc(cm, evt.target.textContent, element.line, text.start, text.end)
      }
    />
  </FormRow>

  <FormRow label={'ID:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      width='100%' 
      compact={true} 
      bind:value={label.string} 
      on:input={(evt) => 
        writeToDoc(cm, evt.target.textContent, element.line, label.start, label.end)
      }
    />
  </FormRow>

{:else if isCollapsed}

  <!------ COLLAPSED OR SHORTCUT ------>

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

{/if}

<!------ DEFINITION ------>

<div class="definition">
  {#if noDefinitionsFound}
    <div class="error-message">No definitions for <span class="id">{label.string}</span> found.</div>
  {:else if multipleDefinitionsFound}
    <div class="error-message">Multiple definitions for <span class="id">{label.string}</span> found.</div>
  {:else}

    <FormRow label={'URL:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
      <InputText
        multiLine={true}
        multiLineMaxHeight='100'
        editable={false}
        width='100%' 
        compact={true} 
        bind:value={definitionUrl} 
      />
    </FormRow>

    {#if definitionTitle}
      <Separator margin={'2px 0 '} />
      <FormRow label={'Title:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
        <InputText
          multiLine={true}
          multiLineMaxHeight='100'
          editable={false}
          width='100%' 
          compact={true} 
          bind:value={definitionTitle} 
        />
      </FormRow>
    {/if}
  {/if}
</div>
