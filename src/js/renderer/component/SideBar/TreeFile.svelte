<script>
  import { onMount } from 'svelte'

  export let state = {}
  export let item = {}

  let selected = false
  let expanded = true
  let type = ''
  let label = ''

  $: {
    if (item.type && item.type == 'doc') {
        label = item.title
        type = 'doc'
    } else if (item.type == 'media') {
        label = item.path.substring(item.path.lastIndexOf('/') + 1)
        switch (item.filetype) {
            case '.png':
            case '.jpg':
            case '.gif':
                type = 'img'
                break
        }
    }
  }

  function clicked() {
    if (selected) return

    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEM',
      item: item,
    })
  }

  function toggleExpanded() {
    expanded = !expanded
    // window.api.send("dispatch", {
    //   type: "TOGGLE_SIDEBAR_ITEM_EXPANDED",
    //   item: item,
    // });
  }
</script>

<style type="text/scss">
</style>

<li class={type} class:selected on:click={clicked}>
  <div class="wrapper">
    <span class="icon"></span>
    <span class="label">{label}</span>
  </div>
</li>
