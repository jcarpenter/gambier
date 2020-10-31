<script>
  import Header from './Header.svelte'
  import DisclosureButton from '../UI/DisclosureButton.svelte'
  import Label from '../UI/Label.svelte'
  import Separator from '../UI/Separator.svelte'
  import Thumbnail from '../UI/Thumbnail.svelte'

  export let state

  let firstRun = true
  let activeTab = {}
  let quantitySelected = 0
  let item = {}
  let isOpen = true

  $: onStateChange(state)

  // -------- STATE -------- //

  function onStateChange(state) {

    if (state.changed.includes('sideBar.activeTab') || firstRun) {
      activeTab = getActiveTab()
      quantitySelected = activeTab.selectedItems.length
      item = getLastSelectedItem()
    }

    if (state.changed.includes('sideBar.preview') || firstRun) {
        isOpen = state.sideBar2.preview.isOpen
    }

    firstRun = false
  }

  // -------- HELPERS -------- //

  function getActiveTab() {
    return state.sideBar2.tabs.find(
      (t) => t.name == state.sideBar2.activeTab.name
    )
  }

  function getLastSelectedItem() {
    const type = activeTab.lastSelectedItem.type
    const id = activeTab.lastSelectedItem.id
    let arrayToLookIn
    switch (type) {
      case 'folder':
        arrayToLookIn = state.folders
        break
      case 'doc':
        arrayToLookIn = state.documents
        break
      case 'media':
        arrayToLookIn = state.media
        break
    }
    return arrayToLookIn.find((i) => i.id == id)
  }

  function toggleOpenClose() {
    window.api.send('dispatch', {
      type: 'TOGGLE_SIDEBAR_PREVIEW',
    })
  }
</script>

<style type="text/scss">
  #preview {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 255px;
    position: absolute;
    transform: translate(0, 100%);

    &:not(.isOpen) {
        bottom: 30px;
    }

    &.isOpen {
        bottom: 255px;
    }
  }

  .media {
    padding: 5px 10px 10px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;
  }
</style>

<div id="preview" class:isOpen>
  <Separator />
  <Header title={'Preview'}>
    <DisclosureButton
      width={16}
      height={16}
      iconInset={4}
      on:toggle={toggleOpenClose} />
  </Header>
  {#if item.type == 'folder'}
    Folder
  {:else if item.type == 'doc'}
    Doc
  {:else if item.type == 'media'}
    <div class="media">
      <Thumbnail src={item.path} margin={'0 0 10px 0'} />
      <Label color={'primary'} typography={'label-normal-small-bold'}>
        {item.name}
      </Label>
      <Label color={'secondary'} typography={'label-normal-small'}>
        {item.filetype.substring(1).toUpperCase()}
        image - 1.25 MB
      </Label>
      <Label color={'secondary'} typography={'label-normal-small'}>
        945 x 1.25
      </Label>
    </div>
  {/if}
</div>
