<script lang='js'>
  import { state } from "../../StateManager";
  import FormRow from "../ui/FormRow.svelte";
  import PopupButton from "../ui/PopupButton.svelte";

  let items = []

  $: size = $state.editorMaxLineWidth.size
  $: size, items = getItems()

  /**
   * Create one item for each increment between min and max.
   */
  function getItems() { 
    let items = []
    const { min, max, increment, size } = $state.editorMaxLineWidth
    for (var i = min; i <= max; i += increment) {
      const value = Math.round(i * 10) / 10
      items.push({ label: value, id: value, checked: value == size })
    }
    return items
  }

</script>

<style lang="scss"></style>

<FormRow label={'Max line width:'} labelTopOffset={'2px'}>
  <PopupButton 
    width='60px' 
    {items}
    on:selectItem={(evt) => {
      window.api.send('dispatch', {
        type: 'SET_EDITOR_MAX_LINE_WIDTH',
        value: evt.detail.item.id
      })
    }}
  >
    <span slot="description">characters</span>
  </PopupButton>
</FormRow>