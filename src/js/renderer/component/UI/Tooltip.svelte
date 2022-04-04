<script>
  import { tooltip } from '../../TooltipManager'
  import { setAsCustomPropOnNode } from './actions'

  let visible = false
  let text = ''
  let x = 0
  let y = 0

  const msDelayUntilShow = 1600
  const msDelayUntilUpdate = 250
  const msDelayUntilHide = 500

  let oldStatus, oldText
  let updateDelayTimer
  let hideDelayTimer

  /*
  Tooltip functionality is driven from tree places: 
  * The `setTooltip` action, which is applied to components that need a tooltip. It listens for mouse events on the component, and updates...
  * The tooltip store, in StateManager. It is updated by the components, which tell it what text to display, and coordinates.
  * This component, which listens for changes to the tooltip store, and updates the appearance of the tooltip accordingly. Most of the code in the switch statement below is concerned with the timing of showing/hiding the tooltip. 
  */

  $: $tooltip, update()

  function update() {
    if (!valuesHaveChanged) return
    
    if (updateDelayTimer) clearTimeout(updateDelayTimer)
    if (hideDelayTimer) clearTimeout(hideDelayTimer)
    
    switch ($tooltip.status) {
      case 'show':

        if (visible) {
          // If tooltip is already visible, and we've moused over a new target (which we know wee have, if valuesHaveChanged and status == 'show') wait a moment before updating. 
          updateDelayTimer = setTimeout(() => {
            text = $tooltip.text
            x = $tooltip.x
            y = $tooltip.y
          }, msDelayUntilUpdate)
        } else {
          // Show after delay. Is triggered on mouseover. Delay is implemented by the `visible` class transition-delay. If a hide timer is active, cancel it.
          visible = true
          text = $tooltip.text
          x = $tooltip.x
          y = $tooltip.y
        }
        break
      case 'hide':
        // Hide immediately. Is triggered by clicking.
        visible = false
        break
      case 'hideAfterDelay':
        // Hide after delay. Is triggered when mousing out.
        hideDelayTimer = setTimeout(() => {
          visible = false
        }, msDelayUntilHide);
        break
    }

    oldStatus = $tooltip.status
    oldText = $tooltip.text
  }

  function valuesHaveChanged() {
    return oldStatus !== $tooltip.status || oldText !== $tooltip.text
  }

</script>

<style type="text/scss">

  #tooltip {
    @include tool-tips-font;
    line-height: 14px;
    display: flex;
    align-items: center;
    pointer-events: none;
    position: fixed;
    max-width: 264px;
    height: 18px;
    padding: 2px 5px;
    z-index: 1000;
    opacity: 0;
    transform: translate(
      calc(var(--x) * 1px), 
      calc(var(--y) * 1px)
    );
    transition: opacity 500ms ease-in-out;
    
    color: var(--label-color);
    background: var(--window-background-color);

    @include dark {
      filter: brightness(0.8);
      box-shadow:
        0 0 0 0.5px gray(40%, 1), // Outline inner (light)
        0 0 0 1px black(0.5), // Outline outer (dark)
        0 2px 6px 0 black(0.1); // Drop shadow
    }

    @include light {
      box-shadow:
        0 0 0 0.5px black(0.125), // Outline
        0 2px 6px 0 black(0.2); // Drop shadow
    }

    &.visible {
      opacity: 1;
      transition: 
        opacity 1ms calc(var(--msDelayUntilShow) * 1ms);
    }
  }
  
</style>

<div id="tooltip" class:visible use:setAsCustomPropOnNode={{x, y, text, msDelayUntilShow}}>
  {text}
</div>