<script lang='js'>
  import Checkbox from '../ui/Checkbox.svelte';
  import Description from '../ui/Description.svelte';
  import FormRow from '../ui/FormRow.svelte';
  import IconButton from '../ui/IconButton.svelte';
  import InputText from '../ui/InputText.svelte';
  import PopupButton from '../ui/PopupButton.svelte';
  import PulldownButton from '../ui/PulldownButton.svelte';
  import PushButton from '../ui/PushButton.svelte';
  import RadioButton from '../ui/RadioButton.svelte';
  import Separator from '../ui/Separator.svelte';
  import Stepper from '../ui/Stepper.svelte';

  let maxWidth = '700px'
  let leftColumn = '250px'
  let gap = '0 10px'
  let margin = '8px 0'

  let popupMenuItems = [
    { label: 'Option 1', id: '1', checked: false, separatorAfter: true },
    { label: 'Option 2', id: '2', checked: true },
    { label: 'Option 3', id: '3', checked: false }
  ]

  let pulldownMenuItems = [
    { label: 'Option 1', id: '1', checked: true, separatorAfter: true },
    { label: 'Option 2', id: '2', checked: false },
    { label: 'Option 3', id: '3', checked: false }
  ]
  
	let radioList = {
    selected: '3s',
    items: [
      {
        id: '1s',
        label: 'One scoop'
      },
      {
        id: '2s',
        label: 'Two scoops'
      },
      {
        id: '3s',
        label: 'Three scoops'
      },
    ]
  }
  
	let checkboxList = {
    selected: ['1s', '2s'],
    items: [
      {
        id: '1s',
        label: 'One scoop'
      },
      {
        id: '2s',
        label: 'Two scoops'
      },
      {
        id: '3s',
        label: 'Three scoops'
      },
    ]
  }

</script>

<style lang="scss">

  .block {
    padding: 0rem 1rem 8rem;
    overflow: scroll;
  }

  h1 {
    @include title1-emphasized-text;
    color: var(--labelColor);
  }

  h2 {
    @include system-regular-font;
    color: var(--label-2-color);
  }

  .stateTable {
    border: 1px solid var(--label-3-color);
    border-radius: 4px;
    padding: 0.4em 0.4em;
    margin-bottom: 1em;

    h2 {
      color: var(--labelColor);
      display: block;
      padding: 0;
      @include system-small-font;
      font-weight: bold;
      margin: 0 0 1em;
    }
  }

  section {
    margin: 10px auto;
    display: grid;
    grid-template-columns: auto fit-content(340px);
    row-gap: 8px;
    width: fit-content;

    > :global(div.row) {
      // Ignore top-level FormRow div and access child
      // elements.
      display: contents !important;
    }

    hr {
      grid-column: span 2;
      width: 100%;
      border: none;
      margin: 1rem 0;
      height: 1px;
      background-color: var(--separator-color);
    }
  }
  
</style>

<!-- state.focusedWindowId: {$state.focusedWindowId} <br/>
isWindowFocused: {$isWindowFocused} <br/>
project.focusedSectionId: {$project.focusedSectionId} <br/> -->

<div class="block">

  <h1>UI Elements</h1>

  <!---------- INPUTTEXT ---------->

  <section>

    <FormRow label={'InputText:'}>
      <InputText placeholder={'Replace'} width={'110px'} style='sidebar' />
      <InputText placeholder={'Replace'} width={'110px'} style='toolbar' />
      <InputText placeholder={'Replace'} width={'110px'} style='inline' />
    </FormRow>

    <FormRow label={'Compact:'} compact={true}>
      <InputText placeholder={'Replace'} width={'110px'} style='sidebar' compact={true} />
      <InputText placeholder={'Replace'} width={'110px'} style='toolbar' compact={true} />
      <InputText placeholder={'Replace'} width={'110px'} style='inline' compact={true} />
    </FormRow>

    <FormRow label={'Single line:'}>
      <InputText width={'110px'} style='sidebar' value={'It was the best.'} />
      <InputText width={'110px'} style='toolbar' value={'It was the best of times, it was the Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.'}/>
      <InputText width={'110px'} style='inline' value={'It was the best of times, it was the Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.'}/>
    </FormRow>

    <FormRow label={'Multi line:'}>
      <InputText multiLine={true} multiLineMaxHeight={100} width={'110px'} style='sidebar' value={'It was the best.'} />
      <InputText multiLine={true} multiLineMaxHeight={100} width={'110px'} style='toolbar' value={'It was the best of times, it was the Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.'}/>
      <InputText multiLine={true} multiLineMaxHeight={100} width={'110px'} style='inline' value={'It was the best of times, it was the Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.'}/>
    </FormRow>

    <FormRow label={'With icon:'}>
      <InputText placeholder={'Replace'} width={'110px'} style='sidebar' icon='search-field-icon' />
      <InputText placeholder={'Replace'} width={'110px'} style='toolbar' icon='search-field-icon' />
      <InputText placeholder={'Replace'} width={'110px'} style='inline' icon='search-field-icon' />
    </FormRow>

    <FormRow label={'With icon & compact:'} compact={true}>
      <InputText placeholder={'Replace'} width={'110px'} style='sidebar' icon='search-field-icon' compact={true} />
      <InputText placeholder={'Replace'} width={'110px'} style='toolbar' icon='search-field-icon' compact={true} />
      <InputText placeholder={'Replace'} width={'110px'} style='inline' icon='search-field-icon' compact={true} />
    </FormRow>

    <FormRow label={'With Description:'} multiLine={true} labelTopOffset={'7px'}>
      <InputText placeholder={'Replace'} width={'300px'} style='inline' />
      <Description margin={'4px 0 0'}>
        An image with alt text on an empty line will be interpreted as a figure element. The image’s alt text will be used as the caption.
      </Description>
    </FormRow>

    <FormRow label={'Disabled:'} multiLine={true} labelTopOffset={'7px'}>
      <InputText placeholder={'I am disabled'} width={'300px'} style='inline' disabled={true} />
    </FormRow>

    <FormRow label={'Error:'} multiLine={true} labelTopOffset={'7px'}>
      <InputText placeholder={'I have an error'} width={'300px'} style='inline' isError={true} />
    </FormRow>

    <hr>

    <!---------- ICON BUTTON ---------->
  
    <FormRow label={'IconButton:'}>
      <IconButton tooltip='Tooltip' />
      <IconButton tooltip='Tooltip' disabled={true} />
    </FormRow>
    <FormRow label={'Compact:'} compact={true}>
      <IconButton tooltip='Tooltip' compact={true} />
      <IconButton tooltip='Tooltip' disabled={true} compact={true} />
    </FormRow>

    <hr>

    <!---------- ICON MENU BUTTON ---------->
  
    <FormRow label={'IconButton w/ Menu:'}>
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={false} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={true} disabled={true} />
    </FormRow>
    <FormRow label={'IconButton w/ Menu (compact):'} compact={true}>
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={true} compact={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={false} compact={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' showCaret={true} disabled={true} compact={true} />
    </FormRow>
    
    <hr>

    <!---------- POPUP BUTTON ---------->
  
    <FormRow label={'PopupButton:'}>
      <PopupButton items={popupMenuItems} width={'110px'} />
      <PopupButton items={popupMenuItems} width={'110px'} disabled={true} />
    </FormRow>

    <FormRow label={'With description:'} {maxWidth} {leftColumn} gap={0} {margin}>
      <PopupButton items={popupMenuItems} width={'110px'}>
        <span slot="description">this is the description slot.</span>
      </PopupButton>
    </FormRow>

    <FormRow label={'Compact:'} compact={true}>
      <PopupButton items={popupMenuItems} width={'110px'} compact={true} />
      <PopupButton items={popupMenuItems} width={'110px'} disabled={true} compact={true} />
    </FormRow>

    <hr>
  
    <!---------- PULLDOWN BUTTON ---------->
  
    <FormRow label={'PulldownButton:'}>
      <PulldownButton items={pulldownMenuItems} width={'110px'} on:select={(evt) => console.log(evt.detail.item)} />
      <PulldownButton items={pulldownMenuItems} width={'110px'} disabled={true} />
    </FormRow>
  
    <FormRow label={'Compact:'} compact={true}>
      <PulldownButton items={pulldownMenuItems} width={'110px'} on:select={(evt) => console.log(evt.detail.item)} compact={true} />
      <PulldownButton items={pulldownMenuItems} width={'110px'} disabled={true} compact={true} />
    </FormRow>
  
    <hr>
  
    <!---------- PUSH BUTTON ---------->
  
    <FormRow label={'PushButton:'}>
      <PushButton label="Normal" width='110px' />
      <!-- <PushButton label="Emphasized" emphasized={true} width='110px' /> -->
      <PushButton label="Disabled" disabled={true} width='110px' />
    </FormRow>
  
    <FormRow label={'Compact:'} compact={true}>
      <PushButton label="Normal" width='110px' compact={true} />
      <!-- <PushButton label="Emphasized" emphasized={true} width='110px' compact={true} /> -->
      <PushButton label="Disabled" disabled={true} width='110px' compact={true} />
    </FormRow>
    
    <hr>
  
    <!---------- RADIO BUTTON ---------->
  
    <FormRow label={'RadioButton:'}>
      {#each radioList.items as item}
        <RadioButton bind:group={radioList.selected} value={item.id} label={item.label} />
      {/each}
    </FormRow>
  
    <FormRow label={'Compact:'} compact={true}>
      {#each radioList.items as item}
        <RadioButton bind:group={radioList.selected} value={item.id} label={item.label} compact={true} />
      {/each}
    </FormRow>
  
    <FormRow label={'Disabled:'}>
      {#each radioList.items as item}
        <RadioButton bind:group={radioList.selected} value={item.id} label={item.label} disabled={true} />
      {/each}
    </FormRow>
  
    <hr>
  
    <!---------- CHECKBOX ---------->
  
    <FormRow label={'Checkbox:'}>
      <Checkbox compact={false} checked={true} />
      <Checkbox compact={false} checked={false} />
      <Checkbox compact={false} disabled={true} checked={true} />
      <Checkbox compact={false} disabled={true} checked={false} />
    </FormRow>
  
    <FormRow label={'Checkbox:'} {maxWidth} {leftColumn} {margin} multiLine={true} labelTopOffset={'3px'}>
      <Checkbox compact={false} checked={true} />
      <Description margin={'4px 0 0 20px'}>
        An image with alt text on an empty line will be interpreted as a figure element. The image’s alt text will be used as the caption.
      </Description>
    </FormRow>
  
    <FormRow label={'Compact:'} compact={true}>
      <Checkbox compact={true} checked={true} />
      <Checkbox compact={true} checked={true} />
      <Checkbox compact={true} disabled={true} checked={true} />
      <Checkbox compact={true} disabled={true} checked={false} />
    </FormRow>
  
    <hr>
  
    <!---------- STEPPER ---------->
    
    <FormRow label={'Stepper:'}>
      <Stepper compact={false} label='Label' />
    </FormRow>
    <FormRow label={'Disabled:'}>
      <Stepper compact={false} disabled={true} label='Label' />
    </FormRow>
  
    <hr>

  </section> 

</div>
