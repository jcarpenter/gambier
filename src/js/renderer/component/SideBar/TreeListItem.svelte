<script context="module">
  let lastSelectedIndex
</script>

<script>
  export let state = {}
  export let index = 0
  export let item = {}
  export let nestDepth = 0

  let type = null
  let isSelected = false
  let isExpandable = false
  let isExpanded = true

//   $: isSelected = state.sideBar2.project.selectedItems.find(
//     (id) => id == item.id
//   )
  $: isExpandable = item.type == 'folder' && item.children.length > 0

  $: {
    // Set `type`
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

  function handleMouseDown(evt) {
    // Click while not selected: Make this the only selected item
    // Cmd-click while not selected: Add this to existing items
    // Cmd-click while selected: Remove this from existing items

    const clickedWhileNotSelected = !evt.metaKey && !isSelected
    const cmdClickedWhileNotSelected = evt.metaKey && !isSelected
    const cmdClickedWhileSelected = evt.metaKey && isSelected
    const shiftClicked = evt.shiftKey

    // lastSelectedIndex = index

    // if (shiftClicked) {
    //     console.log("Shift clicked", item.index)
    // }

    let items = []

    if (
      clickedWhileNotSelected ||
      cmdClickedWhileNotSelected ||
      cmdClickedWhileSelected
    ) {
        
      if (clickedWhileNotSelected) {
        items.push(item.id)
      } else if (cmdClickedWhileNotSelected) {
        items = state.sideBar2.tabs.find((t) => t.name == 'project').selectedItems.concat([item.id])
      } else if (cmdClickedWhileSelected) {
        // Copy array and remove this item from it
        items = state.sideBar2.tabs.find((t) => t.name == 'project').selectedItems.slice()
        const indexToRemove = items.findIndex((id) => id == item.id)
        items.splice(indexToRemove, 1)
      }

      window.api.send('dispatch', {
        type: 'SELECT_SIDEBAR_ITEMS',
        tabName: 'project',
        lastSelectedIndex: item.index,
        selectedItems: items,
      })
    }
  }

  /**
   * Handle key presses
   * Open/close expandable items with left/right arrow
   */
  function handleKeydown(evt) {
    if (!isExpandable || !isSelected) return
    if (!isExpanded && evt.key == 'ArrowRight') {
      toggleExpanded()
    } else if (isExpanded && evt.key == 'ArrowLeft') {
      toggleExpanded()
    }
  }

  function toggleExpanded() {
    isExpanded = !isExpanded
    // window.api.send('dispatch', {
    //   type: 'TOGGLE_SIDEBAR_ITEM_EXPANDED',
    //   item: item,
    // });
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

<svelte:window on:keydown={handleKeydown} />

<div
  style={`--nestOffset: ${nestDepth * 10}px`}
  class="item {type}"
  on:mousedown={handleMouseDown}
  class:isSelected
  class:isExpandable>
  {#if isExpandable}
    <div class="disclosure" class:isExpanded>
      <div
        role="button"
        alt="Toggle Expanded"
        on:mousedown|stopPropagation={toggleExpanded} />
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
        <svelte:self {state} item={child} nestDepth={nestDepth + 1} />
      </li>
    {/each}
  </ul>
{/if}
