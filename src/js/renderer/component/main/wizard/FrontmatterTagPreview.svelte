<script>
 
  export let cm = null
  export let element = null
  export let suppressWarnings = false

  // $: element, onElementUpdate()

  // function onElementUpdate() {
  //   if (!element) return
  //   if (element.spans.length) {
  //     content = element.spans[0]
  //   } else {
  //     const index = element.markdown.indexOf('[') + 1 + element.start
  //     content = { start: index, end: index, string: ''}
  //   }
  // }

</script>

<style type="text/scss"></style>

Search documents tagged {element.markdown}.