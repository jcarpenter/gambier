<script>
  import { project } from '../../StateManager';
  import { files } from '../../FilesManager';
  import { onMount, onDestroy } from 'svelte'

  import Editor from './Editor.svelte';
  import IconButton from '../ui/IconButton.svelte';
  import { createEventDispatcher } from 'svelte'
  import { getCmDataByPanelId } from '../../editor/editor-utils';
  const dispatch = createEventDispatcher()

  export let index = 0
  export let panel = {}
  export let width = 20 // Percentage. Is converted to `20%`.
  export let isFirstPanel = false
  export let isLastPanel = false

  // $: console.log('EditorPanel: panel: ', panel)

  export let highlightAll = undefined
  export let highlightLeftEdge = undefined
  export let highlightRightEdge = undefined

  $: doc = $files.byId[panel.docId]
  $: isFocusedPanel = index == $project.focusedPanelIndex

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

  // TODO 3/17: Remove this? Not sure it's doing anything anymore. Found it active but seemingly not called by anything.

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

<style type="text/scss">

  .panel {
    // position: relative;
    // overflow: hidden;
    // height: 100%;
    // flex:1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .panel:not(.isFocusedPanel) {
    h1 {
      opacity: 0.6;
    }
  }

  // Highlights

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
    from { box-shadow: inset 0 0 0 0 var(--keyboardFocusIndicatorColor); }
    to { box-shadow: inset 0 0 0 5px var(--keyboardFocusIndicatorColor); }
  }

  @keyframes highlightLeftEdge {
    from { box-shadow: inset 0 0 0 0 var(--keyboardFocusIndicatorColor); }
    to { box-shadow: inset 25px 0 0 0 var(--keyboardFocusIndicatorColor); }
  }

  @keyframes highlightRightEdge {
    from { box-shadow: inset 0 0 0 0 var(--keyboardFocusIndicatorColor); }
    to { box-shadow: inset -25px 0 0 0 var(--keyboardFocusIndicatorColor); }
  }

  @keyframes highlightLeftEdgeOfFirstPanel {
    from { box-shadow: inset 0 0 0 0 var(--keyboardFocusIndicatorColor); }
    to { box-shadow: inset 50px 0 0 0 var(--keyboardFocusIndicatorColor); }
  }

  @keyframes highlightRightEdgeOfLastPanel {
    from { box-shadow: inset 0 0 0 0 var(--keyboardFocusIndicatorColor); }
    to { box-shadow: inset -50px 0 0 0 var(--keyboardFocusIndicatorColor); }
  }

  // Header

  .header {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 5px 0 10px;
    height: 30px;
    flex: none;
    user-select: none;
  }

  .tab  {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    overflow: hidden;
  }

  h1 {
    @include system-regular-font;
    color: var(--secondary-label-color);
    margin: 0;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hasUnsavedChanges {
    @include title1-emphasized-text;
    color: var(--secondary-label-color);
    margin-left: 2px;
  } 

  .header:not(:hover) .tab .close {
    display: none;
  }

  .header:hover .tab .close {
    margin-left: 3px;
    display: initial;
  }

  // Resizable divider
  // TODO: Don't see where this is being used...

  .divider {
    height: 100%;
    width: 1px;
    background: var(--separator-color);
    position: relative;

    .dragTarget {
      position: absolute;
      top: 0;
      left: -5px;
      width: 10px;
      height: 100%;
      z-index: 10;
      background: rgba(0, 200, 100, 0.4);
    }
  }

  .isFocusedPanel {
    
  }


</style>


<!-- Panel -->
<div 
  class="panel" 
  style={`width: ${width}%`}
  class:highlightAll
  class:highlightLeftEdge
  class:highlightRightEdge
  class:isFocusedPanel
  class:isFirstPanel
  class:isLastPanel
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

      <!-- Close button. Only show this if there are multiple panels. -->
      {#if $project.panels.length > 1}
        <span class="close">
          <IconButton 
            on:mousedown={(domEvent) => {
              // Stop propogation so we don't trigger `on:mousedown={focusPanel}` on parent div when clicking this button to close the panel. 
              domEvent.stopPropagation()
            }}
            on:mouseup={closeThisPanel} 
            tooltip='Save changes and close editor' 
            compact={true} 
            icon='img-xmark-medium-regular' 
            padding='0' 
            iconScale={0.6} 
          />
        </span>
      {/if}

    </span>

    <!-- New panel button -->
    <IconButton 
      on:mouseup={openPanelToRight} 
      padding='0 4px' 
      tooltip='Add editor to right' 
      compact={true} 
      icon='img-square-split-2x1-medium-regular'
      iconScale={0.8} 
    />
  </div>

  <Editor {panel} {doc} {isFocusedPanel} {width} />

</div>