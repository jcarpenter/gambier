<script>
  import { state, project, sidebar, isWindowFocused } from '../../StateManager';

  import Checkbox from '../ui/Checkbox.svelte';
  import IconButton from '../ui/IconButton.svelte';
  import PopupButton from '../ui/PopupButton.svelte';
  import PulldownButton from '../ui/PulldownButton.svelte';
  import PushButton from '../ui/PushButton.svelte';
  import RadioButton from '../ui/RadioButton.svelte';
  import SearchField from '../ui/SearchField.svelte';
  import Separator from '../ui/Separator.svelte';
  import Stepper from '../ui/Stepper.svelte';

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

<style type="text/scss">

  .block {
    padding: 0rem 1rem;
    overflow: scroll;
  }

  h1 {
    @include label-large-bold;
    color: var(--labelColor);
  }

  h2 {
    @include label-normal;
    color: var(--secondaryLabelColor);
  }

  .stateTable {
    border: 1px solid var(--tertiaryLabelColor);
    border-radius: 4px;
    padding: 0.4em 0.4em;
    margin-bottom: 1em;

    h2 {
      color: var(--labelColor);
      display: block;
      padding: 0;
      @include label-normal-small-bold;
      margin: 0 0 1em;
    }
  }

  section {
    margin: 10px 0;
  }

  .row {
    display: flex;
    gap: 10px;
    position: relative;
    margin-left: 30%;
    // outline: 1px solid pink;

    &:not(:first-child) {
      margin-top: 10px;
    }
  }

  .label {
    @include label-normal;
    // outline: 1px solid blue;
    position: absolute;
    left: -8px;
    color: var(--labelColor);
    transform: translate(-100%, 0);
    height: 20px;
    display: flex;
    align-items: center;
  }

  .label.secondary {
    opacity: 0.25;
  }

</style>

<!-- state.focusedWindowId: {$state.focusedWindowId} <br/>
isWindowFocused: {$isWindowFocused} <br/>
project.focusedSectionId: {$project.focusedSectionId} <br/> -->

<div class="block">
  <h1>UI Elements</h1>

  <!---------- SEARCHFIELD ---------->

  <section>
    <div class="row">
      <div class="label">SearchField:</div>
      <SearchField placeholder={'Replace'} width={'110px'} style='sidebar' icon='img-magnifyingglass' />
      <SearchField placeholder={'Replace'} width={'110px'} style='toolbar' icon='img-magnifyingglass' />
      <SearchField placeholder={'Replace'} width={'110px'} style='inline' icon='img-magnifyingglass' />
    </div>

    <div class="row">
      <div class="label secondary">Compact:</div>
      <SearchField placeholder={'Replace'} width={'110px'} style='sidebar' icon='img-magnifyingglass' compact={true} />
      <SearchField placeholder={'Replace'} width={'110px'} style='toolbar' icon='img-magnifyingglass' compact={true} />
      <SearchField placeholder={'Replace'} width={'110px'} style='inline' icon='img-magnifyingglass' compact={true} />
    </div>
  </section> 

  <Separator />

  <!---------- ICON BUTTON ---------->

  <section>
    <div class="row">
      <div class="label">IconButton:</div>
      <IconButton tooltip='Tooltip' />
      <IconButton tooltip='Tooltip' disabled={true} />
    </div>
    <div class="row">
      <div class="label secondary">Compact:</div>
      <IconButton tooltip='Tooltip' compact={true} />
      <IconButton tooltip='Tooltip' disabled={true} compact={true} />
    </div>
  </section> 
  
  <Separator />

  <!---------- ICON MENU BUTTON ---------->

  <section>
    <div class="row">
      <div class="label">IconButton w/ Menu:</div>
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={false} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={true} disabled={true} />
    </div>
    <div class="row">
      <div class="label secondary">IconButton w/ Menu (compact):</div>
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={true} compact={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={false} compact={true} />
      <IconButton items={pulldownMenuItems} tooltip='Tooltip' icon='img-arrow-up-arrow-down' showCaret={true} disabled={true} compact={true} />
    </div>
  </section> 
  
  <Separator />


  <!---------- POPUP BUTTON ---------->

  <section>
    <div class="row">
      <div class="label">PopupButton:</div>      
      <PopupButton items={popupMenuItems} width={'110px'} />
      <PopupButton items={popupMenuItems} width={'110px'} disabled={true} />
    </div>

    <div class="row">
      <div class="label secondary">Compact:</div>
      <PopupButton items={popupMenuItems} width={'110px'} compact={true} />
      <PopupButton items={popupMenuItems} width={'110px'} disabled={true} compact={true} />
    </div>
  </section> 
  
  <Separator />

  <!---------- PULLDOWN BUTTON ---------->

  <section>
    <div class="row">
      <div class="label">PulldownButton:</div>      
      <PulldownButton items={pulldownMenuItems} width={'110px'} on:select={(evt) => console.log(evt.detail.item)} />
      <PulldownButton items={pulldownMenuItems} width={'110px'} disabled={true} />
    </div>

    <div class="row">
      <div class="label secondary">Compact:</div>      
      <PulldownButton items={pulldownMenuItems} width={'110px'} on:select={(evt) => console.log(evt.detail.item)} compact={true} />
      <PulldownButton items={pulldownMenuItems} width={'110px'} disabled={true} compact={true} />
    </div>
  </section> 

  <Separator />

  <!---------- PUSH BUTTON ---------->
  
  <section>
    <div class="row">
      <div class="label">PushButton:</div>      
      <PushButton label="Normal" width='110px' />
      <PushButton label="Emphasized" emphasized={true} width='110px' />
      <PushButton label="Disabled" disabled={true} width='110px' />
    </div>

    <div class="row">
      <div class="label secondary">Compact:</div>      
      <PushButton label="Normal" width='110px' compact={true} />
      <PushButton label="Emphasized" emphasized={true} width='110px' compact={true} />
      <PushButton label="Disabled" disabled={true} width='110px' compact={true} />
    </div>
  </section>
  
  <Separator />

  <!---------- RADIO BUTTON ---------->

  <section>
    <div class="row">
      <div class="label">RadioButton:</div>
      {#each radioList.items as item}
        <RadioButton bind:group={radioList.selected} value={item.id} label={item.label} />
      {/each}
    </div>
  </section>

  <Separator />

  <!---------- CHECKBOX ---------->

  <section>
    <div class="row">
      <div class="label">Checkbox:</div>
      <Checkbox compact={false} checked={true} />
      <Checkbox compact={false} checked={false} />
      <Checkbox compact={false} disabled={true} checked={true} />
      <Checkbox compact={false} disabled={true} checked={false} />
    </div>
  </section>

  <Separator />

  <!---------- STEPPER ---------->
  
  <section>
    <div class="row">
      <div class="label">Stepper:</div>      
      <Stepper compact={false} label='Label' />
    </div>
    <div class="row">
      <div class="label">Stepper (disabled):</div>
      <Stepper compact={false} disabled={true} label='Label' />
    </div>
  </section>

  <Separator />

</div>
