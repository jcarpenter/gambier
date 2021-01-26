<script>
  import { prettySize } from '../../../shared/utils'
  import { sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import DisclosureButton from '../ui/DisclosureButton.svelte'
  import Header from './Header.svelte'
  import Label from '../ui/Label.svelte'
  import Separator from '../ui/Separator.svelte'
  import Thumbnail from '../ui/Thumbnail.svelte'

  $: isOpen = $sidebar.isPreviewOpen
  $: activeTab = $sidebar.tabsById[$sidebar.activeTabId]

  let file = {}

  $: {
    if (activeTab.selected.length) {
      const fileId = activeTab.selected[activeTab.selected.length - 1]
      file = $files.byId[fileId]
    }
  }

  /**
   * Shorten filepath by making it relative to project directory, 
   * instead of the entire file system.
   * Before: /Users/josh/Desktop/Climate Research/geothermal.md
   * After: Climate Research/geothermal.md
  */
  function shortenPath() {

  }

  function showFileOnDrive(filepath) {
    console.log(filepath)
  }
</script>

<style type="text/scss">  
  #preview {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    transition: flex 250ms ease-out;
    max-height: 215px;
    overflow: hidden;
    
    &.isOpen {
      flex-basis: 215px;
    }

    &:not(.isOpen) {
      flex-basis: 30px;
    }
  }

  .content {
    // height: 205px;
    flex-grow: 1;
    margin: 5px 10px 10px;
    display: flex;
    flex-direction: column;
    // border: 1px solid red;
  }

  .doc-excerpt,
  .img-thumb {
    flex-grow: 1;
    flex-basis: 0;
    flex-shrink: 0;
    overflow: hidden;
    // border-bottom: 1px solid red;
  }

  .img-thumb {
    margin-bottom: 10px;
  }

  .doc-excerpt {
    p {
      .title {
        @include label-normal-bold;
        color: var(--labelColor);;
        // font-weight: 500;
      }
      // border-left: 4px solid var(--tertiaryLabelColor);
      @include label-normal;
      color: var(--labelColor);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 10;
      overflow: hidden;
      pointer-events: none;
      word-break: break-word;
      line-break: auto;
      line-height: 16px;
      // height: 10rem;
      padding: 0 0.75em;
      margin: 0;
    }
  }

  .metadata {
    flex-grow: 0;
    // flex-basis: 0;
    // flex-shrink: 1;

    .path {
      @include label-normal-small;
      color: var(--labelColor);
      opacity: 0.75;
      white-space: nowrap;                   
      overflow: hidden;
      text-overflow: ellipsis;  
      direction: rtl;
      text-align: left;
      line-break: anywhere;
      
      &:hover {
        text-decoration: underline;
        opacity: 1;
      }
    }
  }
</style>

<div id="preview" class:isOpen>

  <Separator />
  
  <Header title={'Details'}>
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

      <!-- DOC -->

      <div class="doc-excerpt">
        <p>
          <span class="title">{file.title ? file.title : file.name} - </span>
          {file.excerpt}
        </p>
      </div>
      <!-- <div class="metadata">
        <Label color={'primary'} typography={'label-normal-small-bold'}>
          {file.title}
        </Label>
        <div class="path" on:click={() => showFileOnDrive(file.path)}>
          {file.path}
        </div>
      </div> -->

    {:else if file.type == 'img'}

      <!-- IMAGE -->

      <div class="img-thumb">
        <Thumbnail src={file.path} margin={'0 0 0 0'} />
      </div>
      <div class="metadata">
        <!-- <Label color={'primary'} typography={'label-normal-small-bold'}>
          {file.name}
        </Label> -->
        <Label align="center" color={'primary'} opacity={0.75} typography={'label-normal-small'}>
          <!-- {file.format.toUpperCase()} -  -->
          {prettySize(file.sizeInBytes, ' ')} - 
          {file.dimensions.width} x {file.dimensions.height}
        </Label>
        <!-- <div class="path" on:click={() => showFileOnDrive(file.path)}>
          {shortenPath(file.path)}
        </div> -->
      </div>
    {:else if file.type == 'av'}AV{/if}
  </div>
</div>
