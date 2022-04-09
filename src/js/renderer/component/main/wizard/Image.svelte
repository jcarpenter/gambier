<script lang='js'>
  import ImagePreview from './ImagePreview.svelte'
  import Expandable from '../../ui/Expandable.svelte';
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import { state } from '../../../StateManager';
  import FormRow from '../../ui/FormRow.svelte';
  import { isUrl, isImagePath } from '../../../../shared/utils';
  import { debounce } from 'debounce'

  export let cm = null
  export let element = null
  export let suppressWarnings = false

  let text
  let url
  let title
  let clearUrlAndTitleOnDestroy = false

  let formattedUrl = ''
  let isValidImagePath
  let isRemoteUrl
  let isLocalUrl

  $: element, onElementUpdate()

  function onElementUpdate() {

    if (!element) return

    text = element.spans.find((f) => f.type.includes('text'))
    url = element.spans.find((f) => f.type.includes('url'))
    title = element.spans.find((f) => f.type.includes('title'))

    if (!text) {
      const index = element.markdown.indexOf('![') + 2 + element.start
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
    
    checkUrl()

  }

  const checkUrl = debounce(() => {
    
    // If url has not changed, return
    if (url.string == formattedUrl) return

    // Update formattedUrl
    formattedUrl = url.string
    
    // If url is blank, return
    if (formattedUrl == '') return

    const hasExtension = formattedUrl.lastIndexOf('.') > 0 
    if (!hasExtension) return
    isValidImagePath = isImagePath(formattedUrl)
    if (isValidImagePath) {
      isRemoteUrl = isUrl(formattedUrl)
      isLocalUrl == !isRemoteUrl
    }
  }, 500, true)


  /**
   * Handle edge case where user deletes URL and leaves Title.
   * We don't write the change until they destroy the element.
   * This avoids unexpected side effects while editing.
   * E.g. Breaking the link by having title but no URL
  */
  export function writeDelayedChanges() {
    if (clearUrlAndTitleOnDestroy) {
      const newImage = `![${text.string}]()`
      writeToDoc(cm, newImage, element.line, element.start, element.end)
    }
    clearUrlAndTitleOnDestroy = false
  }


</script>

<style lang="scss">
  .preview {
    width: 100%;
    height: 9em;
    background: black(0.05);
    padding: 4px;
    margin: 0;
  }
</style>

<header>
  <h1>Image</h1>
</header>

<Separator margin={'0'} />


<!------ PREVIEW ------>

<div class="preview">
  <ImagePreview userSpecifiedUrl={url.string} {cm} {element} objectFit={"contain"} padding={'0px'} />
</div>

<Separator margin={'0 0 8px'} />


<!------ URL ------>

<FormRow label={'URL:'} leftColumn={'30px'} margin={'8px'} compact={true} multiLine={true} labelTopOffset={'3px'}>
  <InputText 
    autofocus={true}
    placeholder={'Required'}
    isError={url.string == '' && !suppressWarnings}
    multiLine={true}
    multiLineMaxHeight='100'
    width='100%' 
    compact={true} 
    value={url.string} 
    on:input={(evt) => {
      // Don't immediately write changes if user makes URL blank,
      // and title is not blank, or else the element will break.
      // E.g. ![text]( "title")
      clearUrlAndTitleOnDestroy = evt.target.textContent == ""
      if (clearUrlAndTitleOnDestroy) {
        url.string = ''
      } else {
        writeToDoc(cm, evt.target.textContent, element.line, url.start, url.end)
      }
    }}
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
        disabled={url.string == ''}
        value={text.string} 
        on:input={(evt) => 
          writeToDoc(cm, evt.target.textContent, element.line, text.start, text.end)
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
        disabled={url.string == ''}
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
