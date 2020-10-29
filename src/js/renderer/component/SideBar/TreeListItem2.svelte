<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let parent = {}
  export let item = {}
  export let nestDepth = 0

  let type = null

  $: isSelected = parent.selectedItems.find((id) => id == item.id)
  $: isExpandable = item.type == 'folder' && item.children.length > 0
  $: isExpanded =
    isExpandable && parent.expandedItems.some((id) => id == item.id)

  // Set `type`
  $: {
    switch (item.type) {
      case 'folder':
      case 'doc':
        type = item.type
        break
      case 'media':
        switch (item.filetype) {
          case '.png':
          case '.jpg':
          case '.gif':
            type = 'image'
            break
          default:
            type = 'av'
            break
        }
        break
    }
  }

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .item.folder .icon {
    background-image: var(--img-folder);
  }

  .item.doc .icon {
    background-image: var(--img-doc-text);
  }

  .item.image .icon {
    background-image: var(--img-photo);
  }

  .item.av .icon {
    background-image: var(--img-play-rectangle);
  }

  .item {
    position: relative;
    min-height: 28px;
    overflow: hidden;
    user-select: none;
    --nestOffset: 0px;
    margin-bottom: 1px;

    // border: 1px solid rgba(255, 100, 0, 0.5) !important;
    // > * {
    //   outline: 1px solid rgba(255, 100, 0, 0.2) !important;
    // }

    &.isSelected {
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .disclosure {
      @include unstyled-button;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 5px);
      width: 10px;
      height: 10px;

      [role='button'] {
        @include centered_background_image;
        background-image: var(--img-chevron-right);
        position: absolute;
        display: inline-block;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        transform: translate(-50%, -50%) rotateZ(0deg);
      }

      &.isExpanded [role='button'] {
        transform: translate(-50%, -50%) rotateZ(90deg);
      }
    }

    .icon {
      @include centered_background_image;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 20px);
      width: 14px;
      height: 14px;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 42px);
      white-space: nowrap;
    }

    .counter {
      @include absolute-vertical-center;
      @include label-normal;
      color: var(--tertiaryLabelColor);
      position: absolute;
      right: 7px;
    }
  }

  .children:not(.isExpanded) {
    height: 0;
    overflow: hidden;
  }

  .children {
    transition: height 0.2s ease-out;
  }
</style>

<div
  style={`--nestOffset: ${nestDepth * 20}px`}
  class="item {type}"
  on:mousedown={(domEvent) => dispatch('mousedown', { 
      item: item,
      isSelected: isSelected,
      domEvent: domEvent
    })}
  class:isSelected
  class:isExpandable>
  {#if isExpandable}
    <div class="disclosure" class:isExpanded>
      <div
        role="button"
        alt="Toggle Expanded"
        on:mousedown|stopPropagation={dispatch('toggleExpanded', {
          item: item,
          isExpanded: isExpanded,
        })} />
    </div>
  {/if}
  <div class="icon" />
  <div class="label">{item.name}</div>
  {#if isExpandable}
    <div class="counter">{item.children.length}</div>
  {/if}
</div>

{#if isExpandable}
  <ul class:isExpanded class="children">
    {#each item.children as child}
      <li class="row">
        <svelte:self
          on:mousedown
          on:toggleExpanded
          {parent}
          item={child}
          nestDepth={nestDepth + 1} />
      </li>
    {/each}
  </ul>
{/if}
