<script>
  import { tooltip } from '../../StateManager'
  import { css } from './actions'

  let isVisible = false
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

        if (isVisible) {
          // If tooltip is already visible, and we've moused over a new target (which we know wee have, if valuesHaveChanged and status == 'show') wait a moment before updating. 
          updateDelayTimer = setTimeout(() => {
            text = $tooltip.text
            x = $tooltip.x
            y = $tooltip.y
          }, msDelayUntilUpdate)
        } else {
          // Show after delay. Is triggered on mouseover. Delay is implemented by the `isVisible` class transition-delay. If a hide timer is active, cancel it.
          isVisible = true
          text = $tooltip.text
          x = $tooltip.x
          y = $tooltip.y
        }
        break
      case 'hide':
        // Hide immediately. Is triggered by clicking.
        isVisible = false
        break
      case 'hideAfterDelay':
        // Hide after delay. Is triggered when mousing out.
        hideDelayTimer = setTimeout(() => {
          isVisible = false
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
@import '../../../../styles/_mixins.scss';

  #tooltip {
    pointer-events: none;
    @include label-normal-small;
    color: var(--secondaryLabelColor);
    background: var(--gridColor);
    position: fixed;
    max-width: 264px;
    min-height: 19px;
    padding: 2px 5px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    display: flex;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    transform: translate(
      calc(var(--x) * 1px), 
      calc(var(--y) * 1px)
    );
    transition: opacity 500ms ease-in-out;

    &.isVisible {
      opacity: 1;
      transition: 
        opacity 1ms calc(var(--msDelayUntilShow) * 1ms);
    }
  }


</style>

<div id="tooltip" class:isVisible use:css={{x, y, text, msDelayUntilShow}}>
  {text}
</div>