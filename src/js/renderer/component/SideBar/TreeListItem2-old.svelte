<script>
  import { slide } from 'svelte/transition'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let parent = {}
  export let listHasFocus = false
  export let item = {}
  export let nestDepth = 0
  export let isQueryEmpty = true

  let type = null

  $: isSelected = parent.selected.find((id) => id == item.id)
  $: isExpandable = item.type == 'folder' && item.children.length > 0
  $: isExpanded =
    isExpandable && parent.expanded.some((id) => id == item.id)

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

  .item.folder .icon {
    -webkit-mask-image: var(--img-folder);
  }

  .item.doc .icon {
    -webkit-mask-image: var(--img-doc-text);
  }

  .item.image .icon {
    -webkit-mask-image: var(--img-photo);
  }

  .item.av .icon {
    -webkit-mask-image: var(--img-play-rectangle);
  }

  ul,
  li {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  // Selected
  .item.isSelected {
    border-radius: 4px;
  }

  // Selected, and parent list IS focused
  .item.isSelected.listHasFocus {
    background-color: var(--selectedContentBackgroundColor);
    .disclosure [role='button'],
    .icon {
      background-color: var(--controlColor);
    }
    .label {
      color: var(--selectedMenuItemTextColor);
    }
    .counter {
      color: var(--controlColor);
      opacity: 0.4;
    }
  }

  // Selected, and parent list NOT focused
  .item.isSelected:not(.listHasFocus) {
    background-color: var(--disabledControlTextColor);
  }

  // Shared
  .item {
    position: relative;
    min-height: 28px;
    overflow: hidden;
    user-select: none;
    --nestOffset: 0px;
    margin-bottom: 1px;

    .disclosure {
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 5px);
      width: 10px;
      height: 10px;

      [role='button'] {
        @include centered_mask_image;
        -webkit-mask-image: var(--img-chevron-right);
        background-color: var(--controlTextColor);
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
      @include centered_mask_image;
      @include absolute-vertical-center;
      background-color: var(--controlAccentColor);
      left: calc(var(--nestOffset) + 20px);
      width: 14px;
      height: 14px;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      color: var(--labelColor);
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

  //   .children:not(.isExpanded) {
  //     height: 0;
  //     overflow: hidden;
  //   }
</style>

<div
  style={`--nestOffset: ${nestDepth * 20}px`}
  class="item {type}"
  on:mousedown={(domEvent) => dispatch('mousedown', {
      item: item,
      isSelected: isSelected,
      domEvent: domEvent,
    })}
  class:listHasFocus
  class:isSelected
  class:isExpandable>
  {#if isExpandable}
    <div class="disclosure" class:isExpanded>
      <div
        role="button"
        alt="Toggle Expanded"
        on:mousedown|stopPropagation={() => dispatch('toggleExpanded', {
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

{#if isQueryEmpty}
  {#if isExpandable && isExpanded}
    <ul
      class:isExpanded
      class="children"
      transition:slide|local={{ duration: 350 }}>
      {#each item.children as child}
        <li class="row">
          <svelte:self
            listHasFocus
            isQueryEmpty
            on:mousedown
            on:toggleExpanded
            {parent}
            item={child}
            nestDepth={nestDepth + 1} />
        </li>
      {/each}
    </ul>
  {/if}
{/if}
