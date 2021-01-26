
<script>
  import { project } from '../../StateManager';
  import EditorPanel from './EditorPanel.svelte';
  import EditorPanelDivider from './EditorPanelDivider.svelte';
  import { arraysEqual } from '../../../shared/utils';

  let panelsEl

  // ------- RESIZE ------- //

  let widths = []

  $: $project.panels, setPanelWidths()

  function setPanelWidths() {
    let newWidths = []
    $project.panels.forEach((p) => newWidths.push(parseFloat(p.width)))
    if (!arraysEqual(widths, newWidths)) {
      widths = newWidths
    }
  }

  /**
  * While user is dragging divider, update `widths` array. 
  * We see changes on panel widths instantly.
  * @param evt - From Svelte. Includes `domEvent` in `evt.detail`
  * @param index - Of panel to left of the divider
  */
  function resizePanel(evt, index) {
    
    const panels = panelsEl.getBoundingClientRect()
    const domEvent = evt.detail.domEvent

    // Get mouse X position inside `panels` width, as %
    const percentPosition = (domEvent.clientX - panels.x) / panels.width * 100
    
    // Get new % width of panel to LEFT of dragged divider
    let cumulativeWidthsToLeft = 0
    for (var i = 0; i < index; i++) {
      cumulativeWidthsToLeft += widths[i]
    }
    const percentWidth = percentPosition - cumulativeWidthsToLeft
    const delta = widths[index] - percentWidth
    
    // Update width of LEFT panel
    widths[index] = percentWidth
    
    // Update width or RIGHT panel. We want its right edge to not move.
    widths[index + 1] = widths[index + 1] + delta
  }

  /**
   * When user is done dragging divider, save changes to store
   */
  function savePanelSizes() {
    window.api.send('dispatch', {
      type: 'SET_PANEL_WIDTHS',
      widths: widths
    })
  }

  /**
   * Set all panels to equal widths When user double clicks a divider
   */
  function dividePanelsEvenly() {
    widths = widths.map((w) => w = 100 / $project.panels.length)
    window.api.send('dispatch', {
      type: 'SET_PANEL_WIDTHS',
      widths: widths
    })
  }


  // ------- DRAGGING ------- //
  
  // NOTE: We have to deal with a very annoying issue with drag-and-drop, wherein leave event fires when we drag over a child element. To prevent that, when leave event fires, we check if the new target is the same as the original (parent) target. If no, we ignore it. `dragTarget` is the variable that saves the target, and that we check against.

  let dragTarget = undefined
  let dragIsActive = false

  function onDragOver() {
    dragIsActive = true
  }

  function onDragEnter(domEvent) {
    const isDoc = domEvent.dataTransfer.types.includes('text/docid')
    if (isDoc) {
      dragTarget = domEvent.target
    }
  }

  /** 
   * Called when 1) user drags outside EditorPanels element, 2) user drags over child element (we regard this as a false positive, and only care if the user has dragged outside the element; see note above), and 3) cancels drag action (e.g. by pressing Escape).
  */
  function onDragLeave(domEvent) {
    if (domEvent.target == dragTarget) {
      reset()
    }
  }

  function onDrop() {
    reset()
  }

  /**
   * Reset various state tracking variables
   */
  function reset() {
    dragTarget = undefined
    indexOfDividerToHighlight = undefined
    indexOfPanelToHighlight = undefined
    draggedTabIndex = undefined
    dragIsActive = false
  }


  // ------- DRAG: DOCS ------- //

  let indexOfDividerToHighlight = undefined
  let indexOfPanelToHighlight = undefined

  function onDragDocOverEdge(evt) {
    if (evt.detail.edge == 'left') {
      indexOfDividerToHighlight = evt.detail.panelIndex
    } else {
      indexOfDividerToHighlight = evt.detail.panelIndex + 1
    }
    indexOfPanelToHighlight = undefined
  }

  function onDragDocOverCenter(evt) {
    indexOfDividerToHighlight = undefined
    indexOfPanelToHighlight = evt.detail.panelIndex
  }

  // ------- DRAG: TABS ------- //
  // These are functions related to dragging panel tabs

  let draggedTabIndex = undefined

  /**
   * We save the index of the dragged tab to a variable.
   * @param evt
   */
  function onDragTabStart(evt) {
    draggedTabIndex = evt.detail.tabIndex
  }

  /**
   * If the dragged tab / panel is to the right, we highlight the left edge of the panel being dragged over. Else, we highlight the right edge.
   */
  function onDragTabOver(evt) {
    if (draggedTabIndex == evt.detail.panelIndex) return

    indexOfDividerToHighlight = evt.detail.panelIndex
    
    if (draggedTabIndex < evt.detail.panelIndex) {
      indexOfDividerToHighlight++
    }
  }

  /**
   * Called when user cancels tab dragging by pressing Escape. We need to clear (reset) the tracking variables in this, the parent.
   */
  function onDragTabCancel() {
    reset()
  }

</script>

<style type="text/scss">
  .panels {
    width: 100%;
    display: flex;
    flex-direction: row;
    height: 100%;
  }
</style>

<div 
  class="panels" 
  bind:this={panelsEl}
  on:dragover={onDragOver}
  on:dragenter|capture={onDragEnter}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
> 

  <!-- Panels -->
  {#each $project.panels as panel, index (panel.id)}
    <EditorPanel 
      {panel} 
      {index}
      highlightAll={indexOfPanelToHighlight == index}
      highlightLeftEdge={indexOfDividerToHighlight == index}
      highlightRightEdge={indexOfDividerToHighlight == index + 1}
      width={widths[index]} 
      isFirstPanel={index == 0}
      isLastPanel={index == $project.panels.length - 1}
      on:dragDocOverEdge={onDragDocOverEdge}
      on:dragDocOverCenter={onDragDocOverCenter}
      on:dragTabStart={onDragTabStart}
      on:dragTabOver={onDragTabOver}
      on:dragTabCancel={onDragTabCancel}
    />

    {#if index !== $project.panels.length - 1}
      <EditorPanelDivider
        enabled={!dragIsActive}
        on:resize={(evt) => resizePanel(evt, index)} 
        on:resizeend={savePanelSizes} 
        on:dblclick={dividePanelsEvenly}
      />
    {/if}

  {/each}

</div>

