<script>
  import Expandable from '../../ui/Expandable.svelte';
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import { state } from '../../../StateManager';
  import FormRow from '../../ui/FormRow.svelte';
  
  export let cm = null
  export let element = null
  export let suppressWarnings = false
  
  let text
  let url
  let title
  let clearUrlAndTitleOnDestroy = false

  $: element, onElementUpdate()

  function onElementUpdate() {

    if (!element) return

    text = element.spans.find((f) => f.type.includes('text'))
    url = element.spans.find((f) => f.type.includes('url'))
    title = element.spans.find((f) => f.type.includes('title'))

    if (!text) {
      const index = element.markdown.indexOf('[') + 1 + element.start
      text = { start: index, end: index, string: '' }
    }

    if (!url) {
      const index = element.markdown.indexOf('](') + 2 + element.start
      url = { start: index, end: index, string: '' }
    }

    if (!title) {
      const index = element.markdown.lastIndexOf(')') + element.start
      title = { start: index, end: index, string: '' }
    }
  }

  /**
   * Handle edge case where user deletes URL and leaves Title.
   * Don't write the change until they exit the wizard.
   * This avoids unexpected side effects while editing.
   * E.g. Breaking the link by having title but no URL
  */
  export function writeDelayedChanges() {
    if (clearUrlAndTitleOnDestroy) {
      const newLink = `[${text.string}]()`
      writeToDoc(cm, newLink, element.line, element.start, element.end)
    }
    clearUrlAndTitleOnDestroy = false
  }

</script>

<style type="text/scss">
</style>

<header>
  <h1>Link</h1>
</header>

<Separator margin={'0 0 8px'} />

<FormRow label={'Text:'} leftColumn={'30px'} margin={'8px'} multiLine={true} labelTopOffset={'4px'} compact={true}>
  <InputText 
    placeholder={'Required'}
    isError={text.string == '' && !suppressWarnings}
    autofocus={true}
    multiLine={true}
    multiLineMaxHeight='100'
    width={'100%'}
    compact={true} 
    value={text.string}
    on:input={(evt) => writeToDoc(cm, evt.target.textContent, element.line, text.start, text.end) }
  />
</FormRow>

<FormRow label={'URL:'} leftColumn={'30px'} margin={'8px'} multiLine={true} labelTopOffset={'4px'} compact={true}>   
  <InputText 
    placeholder={'Required' }
    isError={url.string == '' && !suppressWarnings}
    multiLine={true}
    multiLineMaxHeight={'100'}
    width={'100%' }
    compact={true} 
    value={url.string}
    on:input={(evt) => {
      // Don't immediately write changes if user makes URL blank,
      // and title is not blank, or else the element will break.
      // E.g. [text]( "title")
      const urlIsBlank = evt.target.textContent == ""
      const titleIsNotBlank = title.string !== ""
      if (urlIsBlank && titleIsNotBlank) {
        clearUrlAndTitleOnDestroy = true
      } else {
        clearUrlAndTitleOnDestroy = false
        writeToDoc(cm, evt.target.textContent, element.line, url.start, url.end)
      }
    }}
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
        isDisabled={url.string == ''}
        value={title.string}
        on:input={(evt) => {

          const wasBlank = title.start == title.end
          const isNowBlank = evt.target.textContent.length == 0

          if (wasBlank) {
            // To be a valid Commonmark link title, we need to insert whitespace before the value, and wrap it in quotation marks.
            writeToDoc(cm, ` "${evt.target.textContent}"`, element.line, title.start, title.end)
          } else if (isNowBlank) {
            // If we've cleared the title for whatever reason, we need to also delete the surrounding quotation marks and whitespace.
            writeToDoc(cm, evt.target.textContent, element.line, title.start - 2, title.end + 1)
          } else {
            // If the above are not true, do the usual...
            writeToDoc(cm, evt.target.textContent, element.line, title.start, title.end)
          }
        }}
      />
    </FormRow>
  {/if}
</Expandable>
