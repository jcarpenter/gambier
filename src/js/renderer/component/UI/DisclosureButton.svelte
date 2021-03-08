<script>
  import { css, setSize } from '../ui/actions'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let width = '34px'
  export let height = '28px'
  export let margin = '0'
  export let padding = '4px'
  export let left = 4
  export let rotation = 0
  export let opacity = 1.0
  export let iconColor = 'controlTextColor'

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
    @include centered_mask_image;
    width: 100%;
    height: 100%;
    transform: rotateZ(calc(var(--rotation) * 1deg));
    -webkit-mask-image: var(--img-chevron-down-bold);
  }
</style>

<button
  class='disclosure'
  tabindex='-1'
  use:css={{ left, rotation, opacity }}
  use:setSize={{width, height, margin, padding}}
  on:mousedown|stopPropagation={() => dispatch('toggle')}
>
  <div 
    class='icon' 
    style={`background-color: var(--${iconColor});`}
  />
</button>
