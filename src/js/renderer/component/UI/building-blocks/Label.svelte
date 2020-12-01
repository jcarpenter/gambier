<script>
  import { css } from '../actions';

  export let label
  export let padding = 0
</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';
  span {
    --padding: 8;
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