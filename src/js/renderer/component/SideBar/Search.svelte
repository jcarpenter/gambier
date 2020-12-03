<script>
  import { project, sidebar, files } from '../../StateManager'
  import Header from './Header.svelte'
  import SortMenu from './SortMenu.svelte';
  import Separator from '../ui/Separator.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import DocList from './list/DocList.svelte'
  import Doc from './list/Doc.svelte'
  import DisclosureButton from '../ui/DisclosureButton.svelte';
  import { setContext } from 'svelte';
  import Expandable from '../ui/Expandable.svelte';
  import MenuButton from '../ui/MenuButton.svelte';
  import Token from '../ui/Token.svelte';
  import Checkbox from '../ui/Checkbox.svelte';
  
  let query = '' // Bound to search field

  let tabId = 'search'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

  // -------- SORTING -------- //

  $: sortOptions = [
    { label: 'By Title', group: 'sortBy', isChecked: tab.sortBy == 'By Title' },
    { label: 'By Modified', group: 'sortBy', isChecked: tab.sortBy == 'By Modified' },
    { label: 'separator' },
    { label: 'Ascending', group: 'sortOrder', isChecked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', isChecked: tab.sortOrder == 'Descending' },
  ]

  // -------- OPTIONS -------- //

  $: options = tab.options

  /**
   * Update state when the user modifies the params in the 'Options' section.
   */
  function updateOptions(key, value) {
    let newOptions = {...options}
    newOptions[key] = value
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SEARCH_PARAMS',
      options: newOptions
    })
  }

  $: $files, tab, setLookInMenuOptions() 
    
  let lookInOptions = []

  /**
   * Add each folder in the project as an option in the 'Look In:' menu.
   * First option is "All Folders". Below that, we list the folders.
   */
  function setLookInMenuOptions() {

    // Starting options
    lookInOptions = [
      { label: 'All Folders', isChecked: options.lookIn == 'All Folders' },
      { label: 'separator' },
    ]
    
    // Add each folder
    $files.allIds.forEach((id) => {
      const file = $files.byId[id]
      if (file.type == 'folder') {
        lookInOptions.push({ label: file.name, isChecked: options.lookIn == file.name })
      }
    })
  }


  // -------- RESULTS -------- //

  let results = []

  $: $files, query, options, getResults()

  async function getResults() {
    
    if (!query) {
      results = []
      return
    }

    const params = {
      query: options.matchExactPhrase ? query : `${query}*`
    }

    const dbResults = await window.api.invoke('queryDb', params)

    if (!dbResults) return

    results = dbResults.map((r) => {
      const file = { ...$files.byId[r.id] }
      if (r.body) file.excerpt = r.body
      if (r.title) file.title = r.title
      return r.id
    })
    console.log(results)
  }

</script>

<style type="text/scss">

  #numberOfResults {
    @include label-normal-small;
    color: var(--labelColor);
    min-height: 25px;
    white-space: nowrap;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row {
    margin: 8px 10px 0;
    display: flex;
    align-items: center;
    .label {
      @include label-normal-small;
      user-select: none;
      text-align: right;
      flex-basis: 46px;
      flex-shrink: 0;
      margin-right: 6px;
    }
    .items {
      display: flex;
      align-items: center;
    }
    &:first-of-type {
      margin-top: 5px;
    }
  }
</style>

<div class="section">
  <Header title={tab.title} hoverToShowSlot={true}>
    <SortMenu options={sortOptions} />
  </Header>
  <Separator marginSides={10} />
  <SearchField focused bind:query placeholder={'Name'} />
  <Separator marginSides={10} marginTop={10} />
  <Expandable title={'Options:'} maxExpandedHeight={75}>
    
    <!-- Match -->
    <div class="row">
      <div class="label">Match:</div>
      <div class="items">
        <Checkbox isCompact={true} isChecked={options.matchCase} label='Case' on:click={(evt) => updateOptions('matchCase', !options.matchCase)} />
        <Checkbox isCompact={true} isChecked={options.matchExactPhrase} label='Exact Phrase' on:click={(evt) => updateOptions('matchExactPhrase', !options.matchExactPhrase)} />
        <!-- <Token label={'Case'} /><Token label={'Exact Phrase'} /> -->
      </div>
    </div>

    <!-- Replace -->
    <div class="row">
      <div class="label">Look In:</div>
    <div>
      <MenuButton isCompact={true} options={lookInOptions} menuType={'pulldown'} buttonType={'text'} buttonWidth={110} on:select={(evt) => updateOptions('lookIn', evt.detail.option.label)}/>
    </div>
    </div>
    
    <!-- Tags -->
    <!-- <div class="row">
      <div class="label">Tags:</div>
      <div>
      </div>
    </div> -->

  </Expandable>
  <Separator marginSides={10} />
  <Expandable title={'Replace:'} isOpen={false} />
  <Separator marginSides={10} />

  <!-- <Header title={'Options'}>
    <DisclosureButton
      width={14}
      height={14}
      padding={6}
      left={$sidebar.width - 20}
      rotation={$sidebar.isPreviewOpen ? -90 : 90}
      tooltip={'Toggle Expanded'}
      on:toggle={() => {
        window.api.send('dispatch', { type: 'TOGGLE_SIDEBAR_PREVIEW' })
      }} />
  </Header> -->

  <!-- Replace -->
  
  <!-- Results -->
  {#if query}
    <div id="numberOfResults">Found results in {results.length} documents</div>
  {/if}
  <Separator marginSides={10} />
  <DocList listIds={results} component={Doc} />
</div>

