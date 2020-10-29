<script>
  import Separator from '../UI/Separator.svelte'

  export let state = {}
  export let focused = false

  $: active = state.sideBar2.activeTab.name == 'all-documents'

</script>

<style type="text/css">
  .wrapper:not(.active) {
    display: none;
  }
</style>

<div id="all-documents" class="wrapper" class:focused class:active>
    <header>
        <h1>All Documents</h1>
    </header>
    <Separator />
</div>