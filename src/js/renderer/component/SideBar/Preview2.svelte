<script>
  import { findInTree, prettySize } from '../../../shared/utils'
  import { sidebar, files } from '../../StateManager'

  import DisclosureButton from '../UI/DisclosureButton.svelte'
  import Header from './Header.svelte'
  import Label from '../UI/Label.svelte'
  import Separator from '../UI/Separator.svelte'
  import Thumbnail from '../UI/Thumbnail.svelte'

  $: isOpen = $sidebar.isPreviewOpen
  $: activeTab = $sidebar.tabsById[$sidebar.activeTabId]

  let file = {}

  $: {
    if (activeTab.selected.length) {
      const fileId = activeTab.selected[activeTab.selected.length - 1]
      file = $files.byId[fileId]
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';
  #preview {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    transition: flex 250ms ease-out;
    max-height: 250px;
    overflow: hidden;

    &:not(.isOpen) {
      flex-basis: 30px;
    }

    &.isOpen {
      flex-basis: 250px;
    }
  }

  .content {
    height: 205px;
    margin: 5px 10px 10px;
    display: flex;
    flex-direction: column;
    // border: 1px solid red;
  }

  .thumb {
    margin-bottom: 10px;
    flex-grow: 1;
    flex-basis: 0;
    flex-shrink: 0;
    // border: 1px solid gray;
    // background-color: rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .metadata {
    flex-grow: 0;
    // flex-basis: 0;
    // flex-shrink: 1;
  }
</style>

<div id="preview" class:isOpen>
  <Separator />
  <Header title={'Preview'}>
    <DisclosureButton
      width={14}
      height={14}
      padding={6}
      left={$sidebar.width - 20}
      rotation={$sidebar.isPreviewOpen ? -90 : 90}
      tooltip={'Toggle Expanded'}
      on:toggle={() => {
        window.api.send('dispatch', { type: 'TOGGLE_SIDEBAR_PREVIEW' })
      }} />
  </Header>
  <div class="content">
    {#if file.type == 'doc'}
      {file}
    {:else if file.type == 'img'}
      <div class="thumb">
        <Thumbnail src={file.path} margin={'0 0 0 0'} />
        flex-basis: 0;
      </div>
      <div class="metadata">
        <Label color={'primary'} typography={'label-normal-small-bold'}>
          {file.name}
        </Label>
        <Label color={'secondary'} typography={'label-normal-small'}>
          {file.format.toUpperCase()}
          image -
          {prettySize(file.sizeInBytes, ' ')}
        </Label>
        <Label color={'secondary'} typography={'label-normal-small'}>
          {file.dimensions.width}
          x
          {file.dimensions.height}
        </Label>
      </div>
    {:else if file.type == 'av'}AV{/if}
  </div>
</div>
