<script>
  /**
   * Heavily modified version of SplitPane.
   * https://github.com/sveltejs/svelte-repl/blob/d6a99e702d42eb18142dccbd6b766b56b69245e4/src/SplitPane.svelte
   * - Removed option for vertical layout.
   * - Changed to px instead of %.
   * - Added min/max features.
   *
   * Note: Newer version didn't work for me. Something about bind:clientWidth (and clientHeight) not working on load. Needed to drag before layout worked correctly.
   * Newer version: https://github.com/sveltejs/svelte-repl/blob/master/src/SplitPane.svelte
   */
  import { createEventDispatcher, onMount, tick } from "svelte";

  const dispatch = createEventDispatcher();

  export let min = 150;
  export let max = 300;
  export let start = 200;

  const refs = {};

  let width;
  let dragging = false;

  function setPos(event) {
	const { left } = refs.container.getBoundingClientRect();
    width = clamp(event.clientX - left, min, max);
    dispatch("change");
  }

  function drag(node, callback) {
    const mousedown = event => {
      if (event.which !== 1) return;
      event.preventDefault();
      dragging = true;
      const onmouseup = () => {
        dragging = false;
        window.removeEventListener("mousemove", callback, false);
        window.removeEventListener("mouseup", onmouseup, false);
      };
      window.addEventListener("mousemove", callback, false);
      window.addEventListener("mouseup", onmouseup, false);
    };
    node.addEventListener("mousedown", mousedown, false);
    return {
      destroy() {
        node.removeEventListener("mousedown", onmousedown, false);
      }
    };
  }

  // Copied from:
  // https://github.com/Rich-Harris/yootils/blob/master/src/number/clamp.ts
  function clamp(num, min, max) {
    return num < min ? min : num > max ? max : num;
  }

  onMount(async () => {
    width = start
  });
</script>

<style type="text/scss">
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
  }

  .pane {
    /* position: relative; */
    height: 100%;
    overflow-y: scroll;
  }

  .pane > :global(*) {
    height: 100%;
  }

  .pane.right {
    flex-grow: 1;
  }

  .mousecatcher {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.01);
  }

  .divider {
    position: absolute;
    display: block;
    z-index: 10;
    width: 1px;
    height: 100%;
    background-color: #d4d4d4;
    cursor: ew-resize;
  }

  .divider::after {
    content: "";
    position: absolute;
    /* background-color: rgba(255, 0, 0, 0.2); */
    left: -4px;
    top: 0;
    width: 8px;
    height: 100%;
  }
</style>

<div class="container" bind:this={refs.container}>

  <div class="pane" style="flex: 0 0 {width}px;">
    <slot name="left" />
  </div>

  <div class="pane right">
    <slot name="right" />
  </div>

  <div class="divider" style="left: {width}px" use:drag={setPos} />
</div>

{#if dragging}
  <div class="mousecatcher" />
{/if}
