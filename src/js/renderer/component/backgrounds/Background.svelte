<script>
  import { state } from "../../StateManager";
  import Midnight from "./midnight.svelte";
  import SystemWindow from "./systemWindow.svelte";
 
  let component

  $: componentName = $state.theme.backgroundComponent.name
  $: componentName, setBackground()

  function setBackground() {
    switch (componentName) {
      case 'SystemWindow':
        component = SystemWindow
        break
      case 'Midnight':
        component = Midnight
        break
    }
  }


</script>

<style type="text/scss">
</style>

<svelte:component this={component} />