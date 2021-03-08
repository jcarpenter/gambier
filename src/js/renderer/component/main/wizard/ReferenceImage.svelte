<script>
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc, getReferenceDefinitions } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import ImagePreview from './ImagePreview.svelte';
 
  export let cm = null
  export let element = null
  $: console.log(element)

  let definition = null
  let multipleDefinitionsFound = false
  let noDefinitionsFound = false

  $: { 
    if (element) {
      const definitions = getReferenceDefinitions(cm, element.label.string, 'link')

      noDefinitionsFound = definitions.length == 0
      multipleDefinitionsFound = definitions.length > 1

      // If there's one match, select it
      // Else set definition null
      definition = definitions.length == 1 ?
        definition = definitions[0] :
        null
    }
  }

</script>

<style type="text/scss"></style>

<header>
  <h1>Reference Image</h1>
</header>

<Separator margin={'0 0 8px'} />

{#if element.type.includes('full')}
  
  <!------ FULL ------>

  <FormRow label={'Text:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      multiLine={true}
      multiLineMaxHeight='200'
      width='100%' 
      compact={true} 
      bind:value={element.text.string} 
      on:input={(evt) => 
        writeToDoc(cm, evt.target.textContent, element.line, element.text.start, element.text.end)
      }
    />
  </FormRow>
  <FormRow label={'ID:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      width='100%' 
      compact={true} 
      bind:value={element.label.string} 
      on:input={(evt) => 
        writeToDoc(cm, evt.target.textContent, element.line, element.label.start, element.label.end)
      }
    />
  </FormRow>

{:else}

  <!------ COLLAPSED OR SHORTCUT ------>

  <FormRow label={'ID:'} leftColumn={'20px'} margin={'8px'} compact={true}>
    <InputText 
      width='100%' 
      compact={true} 
      bind:value={element.label.string} 
      on:input={(evt) => 
        writeToDoc(cm, evt.target.textContent, element.line, element.label.start, element.label.end)
      }
    />
  </FormRow>

{/if}

<!------ DEFINITION ------>

<div class="definition">
  {#if noDefinitionsFound}
    <div class="error-message">No definitions for <span class="id">{element.label.string}</span> found.</div>
  {:else if multipleDefinitionsFound}
    <div class="error-message">Multiple definitions for <span class="id">{element.label.string}</span> found.</div>
  {:else}

    <div class="preview">
      <ImagePreview url={definition.url.string} />
    </div>

    <Separator margin={'4px 0 '} />

    <FormRow label={'URL:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
      <InputText
        multiLine={true}
        multiLineMaxHeight='100'
        editable={false}
        width='100%' 
        compact={true} 
        bind:value={definition.url.string} 
      />
    </FormRow>

    <Separator margin={'2px 0 '} />

    <!-- The value of the `alt` attribute depends on the type of the reference link. If it's full, we use the text. Else, for shortcut and collapsed reference links, we use the label. This is per the CommonMark spec: https://spec.commonmark.org/0.29/#shortcut-reference-link  -->
    <FormRow label={'Alt:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
      {#if element.type.includes('full')}
        <InputText
          multiLine={true}
          multiLineMaxHeight='100'
          editable={false}
          width='100%' 
          compact={true} 
          bind:value={element.text.string} 
        />
      {:else}
        <InputText
          multiLine={true}
          multiLineMaxHeight='100'
          editable={false}
          width='100%' 
          compact={true} 
          bind:value={element.label.string} 
        />
      {/if}
    </FormRow>

    {#if definition.title}
      <Separator margin={'2px 0 '} />
      <FormRow label={'Title:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
        <InputText
          multiLine={true}
          multiLineMaxHeight='100'
          editable={false}
          width='100%' 
          compact={true} 
          bind:value={definition.title.string} 
        />
      </FormRow>
    {/if}

  {/if}
</div>