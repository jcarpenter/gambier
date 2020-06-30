<script>
  import { onMount, tick } from "svelte";
  import { clamp } from "../utils";

  export let min = 150;
  export let max = 300;
  export let start = 200;
  export let visible = true

  const refs = {};

  let width;
  let dragging = false;

  function setPos(event) {
    const { left } = refs.container.getBoundingClientRect();
    width = clamp(event.clientX - left, min, max);
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

  onMount(async () => {
    width = start;
  });
</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";
  #container {
    height: 100%;
    overflow-x: visible;
    position: relative;
    display: none;

    &.visible {
        display: block;
    }
  }

  .divider {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, 0);
    width: 8px;
    height: 100%;
    // outline: 1px solid red;
    // background-color: rgba(200, 0, 0, 0.2);
    z-index: 200;
    cursor: ew-resize;
  }
</style>

<div on:click class:visible id="container" bind:this={refs.container} style="flex: 0 0 {width}px;">
  <slot />
  <div class="divider" use:drag={setPos} />
</div>
<!-- 
{#if dragging}
  <div class="mousecatcher" />
{/if} -->
