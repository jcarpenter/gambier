<script>
  import { setAsCustomPropOnNode, setSize } from '../ui/actions'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let width = '34px'
  export let height = '28px'
  export let margin = '0'
  export let padding = '4px'
  export let left = 4
  export let rotation = 0
  export let opacity = 1.0
  export let iconColor = 'control-text-color'

</script>

<style type='text/scss'>

  button {
    @include absolute-vertical-center;
    position: absolute;
    left: calc(var(--left) * 1px);
    border: none;
    outline: none;
    background: none;
    opacity: var(--opacity);
  }

  .icon {
    @include centered-mask-image;
    width: 100%;
    height: 100%;
    transform: rotateZ(calc(var(--rotation) * 1deg));
    -webkit-mask-image: var(--disclosure-chevron-icon);
  }
</style>

<button
  class='disclosure'
  tabindex='-1'
  use:setAsCustomPropOnNode={{ left, rotation, opacity }}
  use:setSize={{width, height, margin, padding}}
  on:mousedown|stopPropagation={() => dispatch('toggle')}
>
  <div 
    class='icon' 
    style={`background-color: var(--${iconColor});`}
  />
</button>
