<script lang='js'>

  export let text;
  export let url;
  export let title;

</script>

<style lang="scss">
  @import "../../../styles/_variables.scss";
</style>

<a class="link" href={url} alt={title}>{text}</a>
