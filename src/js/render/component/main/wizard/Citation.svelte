<script lang='js'>
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  import InputText from '../../ui/InputText.svelte';
  import { store } from '../../../WizardManager';
  
  export let cm = null
  export let element = null
  export let suppressWarnings = false
  
  let content
  let renderedCitation = "<br><br>"

  $: element, onElementUpdate()

  async function onElementUpdate() {

    if (!element) {
      renderedCitation = ""
      return
    }

    // console.log(element)

    // If citation is empty, leave things blank and return
    const isEmpty = element.markdown == "[@]"
    if (isEmpty) {
      const index = element.markdown.indexOf('[') + 1 + element.start
      content = { 
        start: index, 
        end: index, 
        string: ''
      }
      renderedCitation = ""
      return
    } 

    // Else, try to get rendered citation...

    content = element.spans[0]    

    // Make sure the doc has a working bibliography specified
    const doc = window.files.byId[cm.panel.docId]
    const bibliographyExists = doc.bibliography.exists && doc.bibliography.isCslJson
    if (!bibliographyExists) {
      renderedCitation = 'Bibliography not found'
      return
    }

    // Try to get rendered citation
    const result = await window.api.invoke('getCitation', doc.bibliography.path, element.markdown)

    if (result) {
      renderedCitation = result
    } else {
      renderedCitation = 'Citation not found'
    }
  }

  /**
   * Make links open in default browser.
   * If we don't do this, they open inside Electron.
   * @param evt
   */
  function onClick(evt) {
    const targetIsLink = evt.target.tagName == 'A'
    if (targetIsLink) {
      evt.preventDefault()
      window.api.send('openUrlInDefaultBrowser', evt.target.getAttribute('href'))
    }
  }

  
</script>

<style lang="scss">

  .definition {
    opacity: 0.8;
    line-height: 1.4em;
    padding: 8px 10px !important;
  }

  .definition :global(a) {
    color: foregroundColor(0.9);
    text-underline-offset: 1px;
    text-decoration-color: foregroundColor(0.2);
    font-weight: 500;
    
    &:hover {
      color: foregroundColor();
      text-decoration-color: foregroundColor(0.7);
    }
  }

</style>

<header>
  <h1>Citation</h1>
</header>

<Separator margin={'0'} />

<FormRow margin={'8px 8px'}>
  <InputText
    autofocus={$store.openedBy.hover == false}
    placeholder={'Required'}
    isError={content.string == '' && !suppressWarnings}
    multiLine={true}
    multiLineMaxHeight={200}
    width={'100%'}
    compact={true} 
    value={content.string}
    on:input={(evt) => writeToDoc(cm, evt.target.textContent, element.line, content.start, content.end)}
  />
</FormRow>

<div class="definition" on:click|preventDefault={onClick}>
  {@html renderedCitation}
</div>

