<script>
  import { project, sidebar, files } from '../../StateManager'
  import produce from 'immer'
  import Header from './Header.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import Separator from '../ui/Separator.svelte'
  import PopupButton from '../ui/popup/PopupButton.svelte'
  import DocList from './list/DocList.svelte'
  import Doc from './list/Doc.svelte'
  import { setContext } from 'svelte';
  import moment from 'moment'


  let query = '' // Bound to search field
  
  let tabId = 'allDocs'
  setContext('tabId', tabId);

  $: tab = $sidebar.tabsById.allDocs
  $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

  $: sortMenu = [
    { label: 'By Title', group: 'sortBy', isChecked: tab.sortBy == 'By Title' },
    { label: 'By Modified', group: 'sortBy', isChecked: tab.sortBy == 'By Modified' },
    { label: 'separator' },
    { label: 'Ascending', group: 'sortOrder', isChecked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', isChecked: tab.sortOrder == 'Descending' },
  ]

  function setSorting(evt) {
    const selected = evt.detail.option
    console.log(selected)
    sortMenu.forEach((i) => {
      if (i.group == selected.group) {
        i.isChecked = i.label == selected.label
      }
    })

    const sortBy = sortMenu.find((i) => i.group == 'sortBy' && i.isChecked).label
    const sortOrder = sortMenu.find((i) => i.group == 'sortOrder' && i.isChecked).label

    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SORTING',
      tabId: tabId,
      sortBy: sortBy,
      sortOrder: sortOrder,
    })
  }

  // -------- DATA -------- //

  let data = []

  $: $files, query, tab.sortBy, tab.sortOrder, getData()

  function getData() {
    data = produce($files.allIds, (draft) => {
      
      // Get ids with file type 'doc'
      draft = draft.filter((id) => $files.byId[id].type == 'doc')
      
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

        // if (tab.sortBy == 'By Title' && tab.sortOrder == 'Ascending') {
        //   return itemA.name.localeCompare(itemB.name)
        // } else if (tab.sortBy == 'By Title' && tab.sortOrder == 'Descending') {
        //   return itemB.name.localeCompare(itemA.name)
        // } else if (tab.sortBy == 'By Title' && tab.sortOrder == 'Descending') {
        //   return itemB.name.localeCompare(itemA.name)
        // } else if (tab.sortBy == 'By Title' && tab.sortOrder == 'Descending') {
        //   return itemB.name.localeCompare(itemA.name)
        // }
      })
      return draft
    })
  }

</script>

<style type="text/css">
  #allDocs {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    flex-grow: 1;
  }
</style>

<div id="allDocs" class="wrapper">
  <Header title={tab.title}>
    <PopupButton width={100} options={sortMenu} on:select={setSorting}/>
  </Header>
  <Separator marginSides={10} />
  <SearchField focused bind:query placeholder={'Name'} />
  <DocList listIds={data} component={Doc} />
</div>

