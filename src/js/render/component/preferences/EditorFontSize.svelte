<script lang='js'>
  import { state } from "../../StateManager";
  import FormRow from "../ui/FormRow.svelte";
  import PopupButton from "../ui/PopupButton.svelte";

  export let leftColumn

  let items = []

  $: size = $state.editorFont.size
  $: size, items = getItems()

  /**
   * Create one item for each increment between min and max.
   */
  function getItems() { 
    let items = []
    const { min, max, increment, size } = $state.editorFont
    for (var i = min; i <= max; i += increment) {
      items.push({ label: i, id: i, checked: i == size })
    }
    return items
  }

</script>

<style lang="scss"></style>

<FormRow label={'Font size:'} {leftColumn} margin={'8px 0 0'} labelTopOffset={'3px'}>
  <PopupButton 
    width='60px' 
    {items}
    on:selectItem={(evt) => {
      window.api.send('dispatch', {
        type: 'SET_EDITOR_FONT_SIZE',
        value: evt.detail.item.id
      })
    }}
  />
</FormRow>