<script>
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import produce from 'immer'
  import Header from './Header.svelte'
  import SortMenu from './SortMenu.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import Separator from '../ui/Separator.svelte'
  import DocList from './list/DocList.svelte'
  import Media from './list/Media.svelte'
  import { setContext } from 'svelte';
  import moment from 'moment'

  let query = '' // Bound to search field
  
  let tabId = 'media'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

  $: isSidebarFocused = $project.focusedSectionId == 'sidebar'

  $: sortOptions = [
    { label: 'By Name', group: 'sortBy', isChecked: tab.sortBy == 'By Name' },
    { label: 'By Modified', group: 'sortBy', isChecked: tab.sortBy == 'By Modified' },
    { label: 'separator' },
    { label: 'Ascending', group: 'sortOrder', isChecked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', isChecked: tab.sortOrder == 'Descending' },
  ]

  // -------- DATA -------- //

  let data = []

  $: $files, query, tab.sortBy, tab.sortOrder, getData()

  function getData() {
    data = produce($files.allIds, (draft) => {
      
      // Get ids with file type 'img' or 'av'
      draft = draft.filter((id) => $files.byId[id].type == 'img' || $files.byId[id].type == 'av')
      
      // Filter by query 
      if (query) {
        draft = draft.filter((id) => $files.byId[id].name.includes(query))
      }
      
      // Sort
      draft = draft.sort((a, b) => {
        const itemA = $files.byId[a]
        const itemB = $files.byId[b]

        if (tab.sortBy == 'By Name') {
          if (tab.sortOrder == 'Ascending') {
            return itemA.name.localeCompare(itemB.name)
          } else {
            return itemB.name.localeCompare(itemA.name)
          }
        } else if (tab.sortBy == 'By Modified') {
          if (tab.sortOrder == 'Ascending') {
            return moment(itemA.modified).isBefore(itemB.modified)
          } else {
            return moment(itemB.modified).isBefore(itemA.modified)
          }
        }
      })
      
      return draft
    })
  }

</script>

<style type="text/css">
</style>

<div class="section">
  <Header title={tab.title} hoverToShowSlot={true}>
    <SortMenu options={sortOptions} />
  </Header>
  <Separator margin={'0 10px'} />
  <SearchField focused bind:query placeholder={'Name'} margin={'10px 10px 0'} />
  <DocList listIds={data} component={Media} />
</div>

