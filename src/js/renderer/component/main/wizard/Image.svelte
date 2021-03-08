<script>
  import ImagePreview from './ImagePreview.svelte'
  import Expandable from '../../ui/Expandable.svelte';
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import { state } from '../../../StateManager';
  import FormRow from '../../ui/FormRow.svelte';

  export let cm = null
  export let element = null

</script>

<style type="text/scss">
  .preview {
    width: 100%;
    height: 7em;
    background: black(0.05);
    padding: 4px;
    margin: 0;
  }
</style>

<header>
  <h1>Image</h1>
</header>

<Separator margin={'0'} />

<div class="preview">
  <ImagePreview url={element.url.string} />
</div>

<Separator margin={'0 0 8px'} />

<!------ URL ------>

<FormRow label={'URL:'} leftColumn={'30px'} margin={'8px'} compact={true} multiLine={true} labelTopOffset={'3px'}>
  <InputText 
    multiLine={true}
    multiLineMaxHeight='100'
    width='100%' 
    compact={true} 
    bind:value={element.url.string} 
    on:input={(evt) => 
      writeToDoc(cm, evt.target.textContent, element.line, element.url.start, element.url.end)
    }
  />
</FormRow>

<Separator margin={'8px 8px 0'} />

<!------ OPTIONAL ------>
<Expandable 
  title={'Optional:'} 
  margin={'0 8px'} 
  isOpen={$state.wizard.showOptionalImageFields} 
  on:toggle={() => 
    window.api.send('dispatch', { 
      type: 'TOGGLE_WIZARD_OPTIONAL_IMAGE_FIELDS', 
      value: !$state.wizard.showOptionalImageFields 
    })
  }
>
  {#if $state.wizard.showOptionalImageFields}

    <!-- Alt -->
    <FormRow label={'Alt:'} leftColumn={'30px'} margin={'4px 8px 8px'} compact={true}>
      <InputText 
        multiLine={true}
        multiLineMaxHeight='100'
        width='100%' 
        compact={true} 
        bind:value={element.text.string} 
        on:input={(evt) => 
          writeToDoc(cm, evt.target.textContent, element.line, element.text.start, element.text.end)
        }
      />
    </FormRow>

    <!-- Title -->
    <FormRow label={'Title:'} leftColumn={'30px'} margin={'4px 8px 8px'} compact={true}>
      <InputText 
        multiLine={true}
        multiLineMaxHeight='100'
        width='100%' 
        compact={true} 
        bind:value={element.title.string} 
        on:input={(evt) => {
          
          const wasBlank = element.title.start == element.title.end
          const isNowBlank = element.title.string.length == 0
          
          if (wasBlank) {
            // To be a valid Commonmark link title, we need to insert whitespace before the value, and wrap it in quotation marks.
            writeToDoc(cm, ` "${evt.target.textContent}"`, element.line, element.title.start, element.title.end)
          } else if (isNowBlank) {
            // If we've cleared the title for whatever reason, we need to also delete the surrounding quotation marks and whitespace.
            writeToDoc(cm, evt.target.textContent, element.line, element.title.start - 2, element.title.end + 1)
          } else {
            // If the above are not true, do the usual...
            writeToDoc(cm, evt.target.textContent, element.line, element.title.start, element.title.end)
          }
        }}
      />
    </FormRow>

  {/if}
</Expandable>
