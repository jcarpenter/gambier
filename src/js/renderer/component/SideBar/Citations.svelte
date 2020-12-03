<script>
  import { project, sidebar, files } from '../../StateManager'
  import Header from './Header.svelte'
  import Separator from '../ui/Separator.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import DocList from './list/DocList.svelte'
  import Citation from './list/Citation.svelte'
  import { setContext } from 'svelte'

  let query = '' // Bound to search field

  let tabId = 'citations'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

  $: citations = $project.citations

  // -------- DATA -------- //

  let data = []

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .selectCitationsPrompt {
    @include label-normal;
    padding: 0 10px;
  }
</style>

<div class="section">
  <Header title={tab.title} hoverToShowSlot={true}>
    <!-- <SortMenu options={sortOptions} /> -->
  </Header>
  <Separator marginSides={10} />
  {#if citations}
    <SearchField focused bind:query placeholder={'Title or Key'} />
    <DocList listIds={data} component={Citation} />
  {:else}
    <div class="selectCitationsPrompt">
      <p>Select a <a href="https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html">CSL-JSON</a> file containing citations.</p>
      <button
        on:click={() => {
          window.api.send('dispatch', { type: 'SELECT_CITATIONS_FILE_FROM_DIALOG' })
        }}>
        Choose Citations File...
      </button>
    </div>
  {/if}
</div>

