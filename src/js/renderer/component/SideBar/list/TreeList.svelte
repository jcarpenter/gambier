<script>
	import { project, sidebar, files } from '../../../StateManager'
	import {onMousedown, arrowLeftRight, arrowUpDown} from './interactions'
  import Folder from './Folder.svelte';
  import { getContext } from 'svelte';

	export let subtree = {}
  export let listIds = []
  
  const tabId = getContext('tabId')
  $: tab = $sidebar.tabsById[tabId]
	$: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
	.list {
    padding: 10px;
    flex-grow: 1;
    overflow-y: scroll;
    position: relative;
  }
</style>

<svelte:window on:keydown={(evt) => {
	if (!isSidebarFocused) return
  switch (evt.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
      evt.preventDefault()
      arrowLeftRight(evt.key, tab, tabId, listIds, $files)
      break
    case 'ArrowUp':
    case 'ArrowDown':
      evt.preventDefault()
      arrowUpDown(evt.key, evt.shiftKey, evt.altKey, tab, tabId, listIds)
      break
  }
}} />

<div class="list">
	<Folder {tabId} {subtree} {listIds} />
</div>