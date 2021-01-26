<script>
	import { sidebar } from '../../StateManager'
  import { getContext } from 'svelte';
  import IconButton from '../ui/IconButton.svelte';

  // List of menu items
  export let items = []

  const tabId = getContext('tabId')
  $: tab = $sidebar.tabsById[tabId]

  function setSorting(evt) {
    
    const selected = evt.detail.item
    
    if (selected == undefined) return
    
    items.forEach((i) => {
      if (i.group == selected.group) {
        i.checked = i.label == selected.label
      }
    })

    const sortBy = items.find((i) => i.group == 'sortBy' && i.checked)?.label
    const sortOrder = items.find((i) => i.group == 'sortOrder' && i.checked)?.label

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
  <IconButton compact={true} menuWidth='120px' items={items} icon={'img-arrow-up-arrow-down'} tooltip={'Change the sorting criteria and direction'} on:selectItem={setSorting} />
</div>