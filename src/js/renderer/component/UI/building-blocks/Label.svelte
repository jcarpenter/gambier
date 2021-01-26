<script>
  import { css } from '../actions';
  export let label
  export let padding = 8
</script>

<style type="text/scss">
  span {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(-100%, -50%);
    padding-right: calc(var(--padding) * 1px);
  }
</style>

<span use:css={{padding}}>
  {label}:
</span>