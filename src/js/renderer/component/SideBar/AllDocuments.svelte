<script>
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import produce from 'immer'
  import Header from './Header.svelte'
  import SortMenu from './SortMenu.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import Separator from '../ui/Separator.svelte'
  import DocList from './list/DocList.svelte'
  import Doc from './list/Doc.svelte'
  import { setContext } from 'svelte';
  import moment from 'moment'


  let query = '' // Bound to search field
  
  let tabId = 'allDocs'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

  $: isSidebarFocused = $project.focusedSectionId == 'sidebar'

  $: sortOptions = [
    { label: 'By Title', group: 'sortBy', checked: tab.sortBy == 'By Title' },
    { label: 'By Modified', group: 'sortBy', checked: tab.sortBy == 'By Modified', separatorAfter: true},
    { label: 'Ascending', group: 'sortOrder', checked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', checked: tab.sortOrder == 'Descending' },
  ]

  // -------- DATA -------- //

  let data = []

  $: $files, query, tab.sortBy, tab.sortOrder, getData()

  function getData() {
    data = produce($files.allIds, (draft) => {
      
      // Get doc files
      draft = draft.filter((id) => $files.byId[id].isDoc)
      
      // Filter by query 
      if (query) {
        draft = draft.filter((id) => $files.byId[id].name.includes(query))
      }
      
    // Sort
      draft = draft.sort((a, b) => {
        const itemA = $files.byId[a]
        const itemB = $files.byId[b]

        if (tab.sortBy == 'By Title') {
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
    <SortMenu items={sortOptions} />
  </Header>
  <Separator margin={'0 10px'} />
  <SearchField focused bind:query placeholder={'Name'} margin={'8px 12px 0'} />
  <DocList listIds={data} component={Doc} />
</div>

