<script>

  // NOTE: 3/11/22: Some holdover code from when backgrounds could be set by theme.
  // I removed this functionality to simplify scope.
  // May want to add it back in the future.

  // import { state } from "../../StateManager";
  // import Midnight from "./midnight.svelte";
  // import SystemWindow from "./systemWindow.svelte";
 
  // let component

  // $: componentName = $state.appTheme.backgroundComponent.name
  // $: componentName, setBackground()

  // function setBackground() {
  //   switch (componentName) {
  //     case 'SystemWindow':
  //       component = SystemWindow
  //       break
  //     case 'Midnight':
  //       component = Midnight
  //       break
  //   }
  // }
</script>

<style type="text/scss">
  #background {
    background-color: var(--windowBackgroundColor);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    z-index: -1;
  }
</style>

<!-- <svelte:component this={component} /> -->
<div id="background"></div>