<script lang='js'>
  import InputText from '../../ui/InputText.svelte';
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc, getReferenceDefinitions } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import ImagePreview from './ImagePreview.svelte';
 
  export let cm = null
  export let element = null
  export let suppressWarnings = false

  let isFull = false
  let isCollapsed = false
  let multipleDefinitionsFound = false
  let noDefinitionsFound = false
  let clearTextOnDestroy = false
  let clearLabelOnDestroy = false

  let label  
  let text
  let definitionAlt
  let definitionUrl
  let definitionTitle

  $: element, onElementUpdate()

  function onElementUpdate() {

    if (!element) return

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
        definitionAlt = isFull ? text.string : label.string
        definitionUrl = definitions[0].spans.find((s) => s.type.includes('url'))?.string
        definitionTitle = definitions[0].spans.find((s) => s.type.includes('title'))?.string
      } else {
        definitionAlt = undefined
        definitionUrl = undefined
        definitionTitle = undefined
      }
    }
  }
  
  /**
   * Handle edge case where user clears label:
   * Don't write the change until they exit the wizard.
   * This avoids the element/mark suddenly disappearing.
  */
  export function writeDelayedChanges() {

    if (clearTextOnDestroy && clearLabelOnDestroy && isFull) {

      writeToDoc(cm, '![][]', element.line, element.start, element.end)

    } else if (clearTextOnDestroy && isFull) { 

      // If full ref link has no text, 
      // it stops being an element of any kind
      writeToDoc(cm, `![][${label.string}]`, element.line, element.start, element.end)

    } else if (clearLabelOnDestroy && isCollapsed) {

      // If collapsed ref link has no label, 
      // write empty full reference link
      writeToDoc(cm, '![][]', element.line, element.start, element.end)

    } else if (clearLabelOnDestroy && isFull) {

      // If full ref link has no label, it becomes
      // a collapsed reference link, and the text
      // becomes that link's label. Awkard, but there's
      // nothing we can do.
      const newLink = `![${text.string}][]`
      writeToDoc(cm, newLink, element.line, element.start, element.end)

    }


    clearTextOnDestroy = false
    clearLabelOnDestroy = false
  }
</script>

<style lang="scss"></style>

<header>
  <h1>Reference Image</h1>
</header>

<Separator margin={'0 0 8px'} />

{#if isFull }

  <!------ FULL ------>

  <FormRow label={'Text:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      autofocus={true}
      placeholder={'Required'}
      isError={text.string == '' && !suppressWarnings}
      multiLine={true}
      multiLineMaxHeight={'200'}
      width={'100%'}
      compact={true} 
      value={text.string} 
      on:input={(evt) => {
        // If user clears text, delay writing changes until destroy,
        // or else the element/mark will disappear.
        // E.g. Before: [text][label] After: [][label]
        clearTextOnDestroy = evt.target.textContent == ""
        if (clearTextOnDestroy) {
          text.string = ''
        } else {
          writeToDoc(cm, evt.target.textContent, element.line, text.start, text.end)
        }     
      }}
    />
  </FormRow>
  <FormRow label={'ID:'} leftColumn={'30px'} margin={'8px'} compact={true}>
    <InputText 
      placeholder={'Required'}
      isError={label.string == '' && !suppressWarnings}
      width={'100%'} 
      compact={true}
      value={label.string} 
      on:input={(evt) => {
        // If user clears label, delay writing changes until destroy,
        // or else the full reference link will immediately turn into
        // a collapsed version. 
        // E.g. Before: [text][label] After: [label][]
        clearLabelOnDestroy = evt.target.textContent == ""
        if (clearLabelOnDestroy) {
          label.string = ''
        } else {
          writeToDoc(cm, evt.target.textContent, element.line, label.start, label.end)
        }
      }}
    />
  </FormRow>

{:else if isCollapsed}

  <!------ COLLAPSED OR SHORTCUT ------>

  <FormRow label={'ID:'} leftColumn={'20px'} margin={'8px'} compact={true}>
    <InputText 
      autofocus={true}
      placeholder={'Required'}
      isError={label.string == '' && !suppressWarnings}
      width={'100%'}
      compact={true} 
      value={label.string} 
      on:input={(evt) => {
        // If user clears label, delay writing changes until destroy,
        // or else the element/mark will immediately disappear.
        // E.g. Before: [label][] After: [][]
        clearLabelOnDestroy = evt.target.textContent == ""
        if (clearLabelOnDestroy) {
          label.string = ''
        } else {
          writeToDoc(cm, evt.target.textContent, element.line, label.start, label.end)
        }
      }}
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

    <div class="preview">
      <ImagePreview userSpecifiedUrl={definitionUrl} {cm} {element} />
    </div>

    <Separator margin={'4px 0 '} />

    <FormRow label={'URL:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
      <InputText
        multiLine={true}
        multiLineMaxHeight='100'
        editable={false}
        width='100%' 
        compact={true} 
        value={definitionUrl} 
      />
    </FormRow>

    <Separator margin={'2px 0 '} />

    <!-- The value of the `alt` attribute depends on the type of the reference link. If it's full, we use the text. Else, for shortcut and collapsed reference links, we use the label. This is per the CommonMark spec: https://spec.commonmark.org/0.29/#shortcut-reference-link  -->
    <FormRow label={'Alt:'} leftColumn={'30px'} margin={'0'} multiLine={true} labelTopOffset={'4px'} compact={true}>
      <InputText
        multiLine={true}
        multiLineMaxHeight='100'
        editable={false}
        width='100%' 
        compact={true} 
        value={definitionAlt} 
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
          value={definitionTitle} 
        />
      </FormRow>
    {/if}

  {/if}
</div>