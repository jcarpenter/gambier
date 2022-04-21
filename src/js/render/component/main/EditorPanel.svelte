<script lang='js'>
  import { project, sidebar } from '../../StateManager';
  import { files } from '../../FilesManager';
  import { onMount, onDestroy } from 'svelte'

  import Editor from './Editor.svelte';
  import IconButton from '../ui/IconButton.svelte';
  import { createEventDispatcher } from 'svelte'
  import { getCmDataByPanelId } from '../../editor/editor-utils';
  import { setAsCustomPropOnNode } from '../ui/actions';

  const dispatch = createEventDispatcher()

  export let index = 0
  export let panel = {}
  export let width = 20 // Percentage. Is converted to `20%`.
  export let isFirstPanel = false
  export let isLastPanel = false

  export let highlightAll = undefined
  export let highlightLeftEdge = undefined
  export let highlightRightEdge = undefined

  $: doc = $files.byId[panel.docId]
  $: isOnlyPanel = isFirstPanel && isLastPanel
  $: isFocusedPanel = index == $project.focusedPanelIndex
  $: sidebarWidth = $sidebar.width
  
  let el // This element

  // On drag start, if the dragged file is a doc, set it's id as a dataTransfer item. We use a custom `text/docid`. Per: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#dragdata
  function onDragTabStart(domEvent) {
    domEvent.dataTransfer.setData('text/tabindex', index);
    dispatch('dragTabStart', {
      tabIndex: index
    })
  }

  function onDragTabEnd() {
    dispatch('dragTabCancel')
  }

  // ------ DRAG AND DROP ------ //

  function onDragOver(domEvent) {
    
    const isDoc = domEvent.dataTransfer.types.includes('text/docid')
    const isTab = domEvent.dataTransfer.types.includes('text/tabindex')

    if (isDoc) {
      if (isOverLeftEdge(domEvent)) {
        dispatch('dragDocOverEdge', {
          edge: 'left',
          panelIndex: index
        })
      } else if (isOverRightEdge(domEvent)) {
        dispatch('dragDocOverEdge', {
          edge: 'right',
          panelIndex: index
        })
      } else {
        dispatch('dragDocOverCenter', {
          panelIndex: index
        })
      }
    } else if (isTab) {
      dispatch('dragTabOver', {
        panelIndex: index
      })
    }
  }

  function onDrop(domEvent) {
    const isDoc = domEvent.dataTransfer.types.includes('text/docid')
    const isTab = domEvent.dataTransfer.types.includes('text/tabindex')
    
    if (isDoc) {
      if (isOverLeftEdge(domEvent)) {
        openDocInNewPanel(domEvent, index)
      } else if (isOverRightEdge(domEvent)) {
        openDocInNewPanel(domEvent, index + 1)
      } else {
        openDocInThisPanel(domEvent)
      }
    } else if (isTab) {
      
      const draggedTabIndex = domEvent.dataTransfer.getData('text/tabindex')

      window.api.send('dispatch', { 
        type: 'MOVE_PANEL', 
        fromIndex: draggedTabIndex, 
        toIndex: index
      })

    }
  }
  
  /**
   * When user drops doc onto this panel, load the doc.
   */
  function openDocInThisPanel(domEvent) {
      
    // Only proceed if dragged doc is different from current.
    const draggedDocId = domEvent.dataTransfer.getData('text/docid')
    if (draggedDocId == panel.docId) return 
    
    // Load dragged doc
    window.api.send('dispatch', { 
      type: 'OPEN_DOC_IN_PANEL', 
      panelIndex: index,
      doc: files.byId[draggedDocId],
      selectInSideBar: true,
      outgoingDoc: doc,
      outgoingDocData: panel.unsavedChanges ?
        getCmDataByPanelId(panel.id) : '',
      isNewDoc: panel.docId == 'newDoc'
    })
    
    // Focus panel
    focusPanel()
  }

  /**
   * When user drops doc onto the edges of this panel, create a new panel on that side, and load the doc in it.
   */
   function openDocInNewPanel(domEvent, newPanelIndex) {
    window.api.send('dispatch', {
      type: 'OPEN_NEW_PANEL',
      docId: domEvent.dataTransfer.getData('text/docid'),
      panelIndex: newPanelIndex
    })
  }

  /**
   * While dragging, is mouse over left edge of panel?
   * "Edge" width is 25px, or 50px on far left/right.
   * @param domEvent
   */
  function isOverLeftEdge(domEvent) {
    // Get mouse position inside the element
    const posX = domEvent.clientX - el.getBoundingClientRect().x
    return isFirstPanel ? posX < 50 : posX < 25
  }

  /**
   * While dragging, is mouse over left edge of panel?
   */
  function isOverRightEdge(domEvent) {
    const { x, width } = el.getBoundingClientRect()
    // Get mouse position inside the element
    const posX = domEvent.clientX - x
    return isLastPanel ? posX > width - 50 : posX > width - 25
  }


  // ------ RESIZE ------ //

  // TODO 3/17/21: Remove this? Not sure it's doing anything anymore. Found it active but seemingly not called by anything.

  // /**
  //  * If user clicks-and-drags close enough to left/right edges, we start a resize operation (and cancel the event default). Else we just focus the panel.
  //  */
  //  function onMouseDown(domEvent) {
    
  //   const { x, width } = el.getBoundingClientRect()
  //   const posX = domEvent.clientX - x
  //   const isCloseEnoughToLeftEdge = posX < 10
  //   const isCloseEnoughToRightEdge = posX > width - 10

  //   if (isCloseEnoughToRightEdge || isCloseEnoughToRightEdge) {
  //     domEvent.preventDefault()
  //   } else {
  //     focusPanel()
  //   }
  // }

  // function setWidth(domEvent) {
  //   dispatch('resize', { 
  //     domEvent: domEvent, 
  //   })
  // }

  // function resize(domEvent) {
  //   dragging = true;
  //   window.addEventListener('mouseup', resizeEnd, false);
  //   window.addEventListener('mousemove', setWidth, false);
  // }

  // function resizeEnd() {
  //   dragging = false;
  //   window.removeEventListener('mouseup', resizeEnd, false);
  //   window.removeEventListener('mousemove', setWidth, false);
  //   dispatch('resizeend')
  // }


  // ------- OPEN, CLOSE, AND FOCUS PANELS ------- //

  /**
   * Open new panel to right of current one, with an empty doc
   */
   function openPanelToRight() {
    window.api.send('dispatch', {
      type: 'OPEN_NEW_PANEL',
      docId: 'newDoc',
      panelIndex: index + 1
    })
  }

  function closeThisPanel() {
    window.api.send('dispatch', {
      type: 'CLOSE_PANEL',
      panelIndex: index,
      outgoingDoc: doc,
      outgoingDocData: panel.unsavedChanges ? 
        getCmDataByPanelId(panel.id) : '',
      isNewDoc: panel.docId == 'newDoc'
    })
  }

  function focusPanel() {
    if ($project.focusedPanelIndex == index) return
    window.api.send('dispatch', {
      type: 'FOCUS_PANEL',
      panelIndex: index
    })
  }

  // ------- ON MOUNT ------- //

  let removeListenerMethods = []

  onMount(() => {
    const listener1 = window.api.receive('mainRequestsCloseFocusedPanel', () => {
      if (isFocusedPanel) {
        closeThisPanel()
      }
    })
    removeListenerMethods.push(listener1)
  })

  onDestroy(() => {
    // Remove `window.api.receive` listeners
    removeListenerMethods.forEach((remove) => remove())
  })


</script>

<style lang="scss">

  // ------ Top-level ------ //

  .panel {
    display: flex;
    flex-direction: column;

    // Multiple panels: Center editor in panel
    &:not(.isOnlyPanel) {
      align-items: center;
    }
    
    // Single panel: Center editor with window
    // by adding right amount of padding-left.
    &.isOnlyPanel {
      // padding-left: calc(calc(50vw - var(--sidebarWidth) * 1px) - calc(var(--editor-maxlinewidth) / 2) - var(--editor-maxpadding));
    }
  }

  // Styles for .header and .editor child divs
  .panel > :global(div) {
    position: relative;
    width: 100%;
    &::before {
      content: '';
      position: absolute;
      background-color: var(--editor-background-color);
      width: 100%;
      height: 100%;
      left: 0;
      z-index: -1;
    }
  }

  // If there's only one panel, we draw it as a floating document.
  // by limiting the width of the ::before pseudo element which
  // has the visibile background color
  .panel.isOnlyPanel > :global(div)::before {
    position: absolute;
    width: calc(var(--editor-maxlinewidth) + var(--editor-side-padding) * 2);
    height: 100%;
    // left: 50%;
    left: calc(calc(50vw - var(--sidebarWidth) * 1px) - calc(var(--editor-maxlinewidth) / 2) - var(--editor-side-padding));
    // transform: translate(-50%, 0);
  }  
  
  // Round the top edges of the first div
  // If there are multiple panels, this will be .header
  // If there's only one panel, this will be .editor
  .panel > :global(div):first-of-type {
    &::before {
      border-radius: var(--editor-border-radius) var(--editor-border-radius) 0 0;
    }
  }

  .panel:not(.isFocusedPanel) {
    h1 {
      opacity: 0.6;
    }
  }


  // ------ Header ------ //

  .header {
    // width: 100%;
    // min-width: 22em;
    // max-width: calc(var(--editor-maxlinewidth) + var(--editor-side-padding) * 2);
    display: flex;
    flex-direction: row;
    align-items: center;
    height: var(--editor-header-height); // This is set in codemirror.scss
    flex: none;
    user-select: none;
  }

  .tab  {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    overflow: hidden;
    padding: 0 5px 0 10px;
  }

  h1 {
    @include system-regular-font;
    color: var(--label-2-color);
    margin: 0;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hasUnsavedChanges {
    @include title1-emphasized-text;
    color: var(--label-2-color);
    margin-left: 2px;
  } 

  .header:not(:hover) .tab .close {
    display: none;
  }

  .header:hover .tab .close {
    margin-left: 3px;
    display: initial;
  }


  // ------ Highlight ------ //

  .highlightAll,
  .highlightLeftEdge,
  .highlightRightEdge {
    animation-delay: 100ms;
    animation-duration: 100ms;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
  }

  .highlightAll {
    animation-name: highlightAll;
  }

  .highlightLeftEdge {
    animation-name: highlightLeftEdge;
  }

  .highlightRightEdge {
    animation-name: highlightRightEdge;
  }

  .highlightLeftEdge.isFirstPanel {
    animation-name: highlightLeftEdgeOfFirstPanel;
  }

  .highlightRightEdge.isLastPanel {
    animation-name: highlightRightEdgeOfLastPanel;
  }


  @keyframes highlightAll {
    from { box-shadow: inset 0 0 0 0 var(--focus-ring-color); }
    to { box-shadow: inset 0 0 0 5px var(--focus-ring-color); }
  }

  @keyframes highlightLeftEdge {
    from { box-shadow: inset 0 0 0 0 var(--focus-ring-color); }
    to { box-shadow: inset 25px 0 0 0 var(--focus-ring-color); }
  }

  @keyframes highlightRightEdge {
    from { box-shadow: inset 0 0 0 0 var(--focus-ring-color); }
    to { box-shadow: inset -25px 0 0 0 var(--focus-ring-color); }
  }

  @keyframes highlightLeftEdgeOfFirstPanel {
    from { box-shadow: inset 0 0 0 0 var(--focus-ring-color); }
    to { box-shadow: inset 50px 0 0 0 var(--focus-ring-color); }
  }

  @keyframes highlightRightEdgeOfLastPanel {
    from { box-shadow: inset 0 0 0 0 var(--focus-ring-color); }
    to { box-shadow: inset -50px 0 0 0 var(--focus-ring-color); }
  }

</style>


<!-- Panel -->
<div 
  class="panel"
  style:width="{width}%"
  class:highlightAll
  class:highlightLeftEdge
  class:highlightRightEdge
  class:isFocusedPanel
  class:isOnlyPanel
  class:isFirstPanel
  class:isLastPanel
  use:setAsCustomPropOnNode={{sidebarWidth}}
  bind:this={el}
  on:click={() => {
    if ($project.focusedSectionId !== 'editor') {
      window.api.send('dispatch', { type: 'SET_LAYOUT_FOCUS', section: 'editor' })
    }
  }}
  on:mousedown={focusPanel}
  on:dragover|preventDefault={onDragOver}
  on:drop={onDrop}
>

  <!-- Only show header if there are multiple panels. -->
  {#if !isOnlyPanel}
    <div class="header">
      <span class="tab">  
        
          <!-- Name of doc -->
          <h1 
            draggable=true
            on:dragstart={onDragTabStart}
            on:dragend={onDragTabEnd}
          >
            {#if doc}
              {doc.title ? doc.title : doc.name}
            {:else}
              Untitled-1
            {/if}
          </h1>

          <!-- Unsaved changes -->
          {#if panel.unsavedChanges}
          <span class="hasUnsavedChanges">•</span>
          {/if}
          
          <!-- Close button -->
          <span class="close">
            <IconButton 
              on:mousedown={(domEvent) => {
                // Stop propogation so we don't trigger `on:mousedown={focusPanel}` on parent div when clicking this button to close the panel. 
                domEvent.stopPropagation()
              }}
              on:mouseup={closeThisPanel} 
              tooltip='Save changes and close editor' 
              compact={true} 
              icon='editor-panel-close-icon' 
              padding='0' 
              iconScale={0.6} 
            />
          </span>

      </span>

      <!-- New panel button -->
      <!-- <IconButton 
        on:mouseup={openPanelToRight} 
        padding='0 4px' 
        tooltip='Add editor to right' 
        compact={true} 
        icon='img-square-split-2x1-medium-regular'
        iconScale={0.8} 
      /> -->
    </div>
  {/if}

  <Editor {panel} {doc} {isFocusedPanel} {width} />

</div>