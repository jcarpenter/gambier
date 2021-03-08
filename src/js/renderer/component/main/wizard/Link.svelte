<script>
  import Expandable from '../../ui/Expandable.svelte';
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import { state } from '../../../StateManager';
  import FormRow from '../../ui/FormRow.svelte';
  
  export let cm = null
  export let element = null

  // $: console.log(element)

</script>

<style type="text/scss">
</style>

<header>
  <h1>Link</h1>
</header>

<Separator margin={'0 0 8px'} />

<FormRow label={'Text:'} leftColumn={'30px'} margin={'8px'} multiLine={true} labelTopOffset={'4px'} compact={true}>
  <InputText 
    multiLine={true}
    multiLineMaxHeight='100'
    placeholder='' 
    width='100%'
    compact={true} 
    bind:value={element.text.string} 
    on:input={(evt) => 
      writeToDoc(cm, evt.target.textContent, element.line, element.text.start, element.text.end)
    }
  />
</FormRow>

<FormRow label={'URL:'} leftColumn={'30px'} margin={'8px'} multiLine={true} labelTopOffset={'4px'} compact={true}>   
  <InputText 
    multiLine={true}
    multiLineMaxHeight='100'
    placeholder='' 
    width='100%' 
    compact={true} 
    bind:value={element.url.string} 
    on:input={(evt) => 
      writeToDoc(cm, evt.target.textContent, element.line, element.url.start, element.url.end)
    }
  />
</FormRow>

<Separator margin={'8px 8px 0'} />

<Expandable 
  title={'Optional:'} 
  margin={'0 8px'} 
  isOpen={$state.wizard.showOptionalLinkFields} 
  on:toggle={() => 
    window.api.send('dispatch', { 
      type: 'TOGGLE_WIZARD_OPTIONAL_LINK_FIELDS', 
      value: !$state.wizard.showOptionalLinkFields 
    })
  }
>
  {#if $state.wizard.showOptionalLinkFields}
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
