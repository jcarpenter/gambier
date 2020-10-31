<script>
  export let title = 'Title'
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  header {
    padding: 0 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: 30px;

    h1 {
      @include label-normal;
      color: var(--labelColor);
      user-select: none;
      font-weight: bold;
      font-size: 13px;
      flex-grow: 1;
      margin: 0;
      padding: 0;
    }
  }
  
  .right {
    //   border: 1px solid red;
    //   flex-basis: 40px;
  }
</style>

<header>
  <h1>{title}</h1>
  <div class="right">
      <slot></slot>
  </div>
</header>
