<script lang='js'>
  import { state } from "../../StateManager";
  import FormRow from "../ui/FormRow.svelte";
  import PopupButton from "../ui/PopupButton.svelte";

  let items = []

  $: size = $state.editorLineHeight.size
  $: size, items = getItems()

  /**
   * Create one item for each increment between min and max.
   */
  function getItems() { 
    let items = []
    const { min, max, increment, size } = $state.editorLineHeight
    for (var i = min; i <= max; i += increment) {
      const value = Math.round(i * 10) / 10
      items.push({ label: value, id: value, checked: value == size })
    }
    return items
  }

</script>

<style lang="scss"></style>

<FormRow label={'Line height:'} labelTopOffset={'2px'}>
  <PopupButton 
    width='60px' 
    {items}
    on:selectItem={(evt) => {
      window.api.send('dispatch', {
        type: 'SET_EDITOR_LINE_HEIGHT',
        value: evt.detail.item.id
      })
    }}
  />
</FormRow>