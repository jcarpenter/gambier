<script>
  import File from "./File.svelte";
  import { onMount } from "svelte";

  export let nestedDepth = 0;
  export let expanded = true;
  export let selected = false;
  export let hidden = false;
  export let details = {};

  function select() {
    window.api.send("dispatch", { type: "SELECT_FOLDER", id: details.id });
  }

  function update(state) {
    selected = state.selectedFolderId === details.id;
  }

  window.api.receive("stateChanged", state => {
    update(state);
  });

  onMount(async () => {
    const state = await window.api.invoke("getState");
    update(state);
  });
</script>

<style type="text/scss">
//   .expanded {
//   }

  .folder-icon {
    width: 0.9em;
    box-sizing: content-box;
    padding-right: 0.5em;
    flex-basis: 0;
    opacity: 0.3;
  }

  [data-nested="1"] .folder-icon {
      padding-left: 1em;
  }

  [data-nested="2"] .folder-icon {
      padding-left: 2em;
  }

  [data-nested="3"] .folder-icon {
      padding-left: 3em;
  }

  [data-nested="4"] .folder-icon {
      padding-left: 4em;
  }

  ul {
    padding: 0;
    margin: 0;
    list-style: none;
    width: 100%;
    /* border-left: 1px solid #eee; */
  }

  li {
    align-items: center;
    display: flex;
    font-size: 0.8rem;
    line-height: 1.4em;
    padding: 0.4em 1em;

    &.selected {
      background-color: rgba(0, 0, 0, 0.05);
    }

    &.childDirectory {
      padding: 0;
    //   padding-left: 1em;
    }

    &:hover {
      cursor: default;
    }
  }
</style>

{#if expanded}
  <ul>
    {#if !hidden}
      <li data-nested={nestedDepth} class:selected on:click={select}>
        <img src="images/folder.svg" class="folder-icon" />
        {details.name}
      </li>
    {/if}
    {#if details.children}
      {#each details.children as childDirectory}
        <li class="childDirectory">
          <svelte:self details={childDirectory} nestedDepth={nestedDepth + 1} expanded />
        </li>
      {/each}
    {/if}
  </ul>
{/if}
