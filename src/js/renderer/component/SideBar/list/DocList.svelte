<script>
	import { project, sidebar } from '../../../StateManager'
	import { files } from '../../../FilesManager'
	import { arrowUpDown} from './interactions'
  import { getContext } from 'svelte';
	
	export let listIds = []
  export let component
  export let showTags = false
  
  const tabId = getContext('tabId')
  $: tab = $sidebar.tabsById[tabId]
	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'

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
    case 'ArrowUp':
    case 'ArrowDown':
      evt.preventDefault()
      arrowUpDown(evt.key, evt.shiftKey, evt.altKey, tab, tabId, listIds, $files, $project)
      break
  }
}} />

<div class="list">
	{#each listIds as id (id)}
		<svelte:component this={component} {id} {listIds} />
	{/each}
</div>