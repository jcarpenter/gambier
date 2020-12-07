<script>
  import MenuButton from '../ui/MenuButton.svelte'
	import { sidebar } from '../../StateManager'
  import { getContext } from 'svelte';

  // List of options in format:

  export let options

  const tabId = getContext('tabId')
  $: tab = $sidebar.tabsById[tabId]

  function setSorting(evt) {
    const selected = evt.detail.option
    options.forEach((i) => {
      if (i.group == selected.group) {
        i.isChecked = i.label == selected.label
      }
    })

    const sortBy = options.find((i) => i.group == 'sortBy' && i.isChecked)?.label
    const sortOrder = options.find((i) => i.group == 'sortOrder' && i.isChecked)?.label

    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SORTING',
      tabId: tabId,
      sortBy: sortBy,
      sortOrder: sortOrder,
    })
  }

</script>

<style type="text/scss">
  .sortMenu {
    transform: translate(2px, 0);
  }
</style>

<div class="sortMenu">
<MenuButton tooltip={'Change the sorting criteria and direction'} buttonType={'icon'} icon={'img-arrow-up-arrow-down'} menuType={'pulldown'} menuWidth={105} {options} on:select={setSorting}/>
</div>