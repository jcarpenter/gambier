<script>
  import GenericTextButton from './building-blocks/GenericTextButton.svelte';
  import Label from './building-blocks/Label.svelte';
  import Menu from './building-blocks/Menu.svelte'
  import { css } from './actions';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let options = []
  export let compact = false
  export let label = ''
  export let labelPadding = 8
  export let width = 60
  let height = compact ? 14 : 22

  let menuX = 0
  let menuY = 0
  let menuItemHeight = 18

  $: buttonLabel = options.find((opt) => opt.isChecked)?.label
 
  let div
  let isOpen = false

  /** 
   * Toggle the menu open/closed. Set menu position, then reveal it by setting `isOpen` true.
   */
  function toggleOpenClose() {
    if (!isOpen) {

      // Reset variables
      isOpen = true

      // Set menu position values
      const {x, y} = div.getBoundingClientRect()
      const indexOfFirstCheckedOption = options.findIndex((opt) => opt.isChecked)
      menuX = x - 13
      menuY = y - (indexOfFirstCheckedOption * menuItemHeight) - 4

    } else {
      isOpen = false
    }
  }

  function onSelect(evt) {
    isOpen = false
    dispatch('select', {option: evt.detail.option})
  }

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838

  // // Compact
  // .compact {
  //   .button {
  //     height: 14px;
  //     @include label-normal-small;
  //   }
  // }

  // // Normal
  // .popup-button {
  //   --width: 0;
  //   --height: 0;
  //   --labelPadding: 0;
  //   position: relative;
  //   user-select: none;
  //   width: calc(var(--width) * 1px);
  //   @include label-normal;
  // }

</style>

<div bind:this={div} class:compact class="popup-button" use:css={{width, height, labelPadding}} >

  <!-- Menu -->
  {#if isOpen}
    <Menu {options} itemWidth={width} itemHeight={menuItemHeight} left={menuX} top={menuY} on:select={onSelect} />
  {/if}

  {#if label}
    <Label label={'Sort'} padding={labelPadding} />
  {/if}

  <!-- Button -->
  <GenericTextButton type={'popup'} {width} {height} label={buttonLabel} on:mousedown={toggleOpenClose} />
  
</div>

