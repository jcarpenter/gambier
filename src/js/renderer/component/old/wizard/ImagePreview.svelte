<script>
    export let url = null

    let element = null
    let clientWidth = 0
    let clientHeight = 0
    let offsetWidth = 0
    let offsetHeight = 0

    $: {
        if (url !== null && element !== null) {
            
            // const viewportOffset = element.getBoundingClientRect()
            // console.log(viewportOffset.x, viewportOffset.y)
            // console.log(viewportOffset.width, viewportOffset.height)
            
            // window.api.send(
            //     'displayRemoteWebContent',
            //     500,
            //     500,
            //     200,
            //     100,
            //     url
            // )
        }
    }
</script>

<style type="text/scss">
    // @import "../../../styles/_variables.scss";
    img,
    #preview {
        width: 6em;
        height: 6em;
        background-color: red;
    }


</style>

<!-- <iframe id="preview" title="Image" src={url} /> -->

<!-- <div bind:this={element} bind:clientWidth bind:clientHeight bind:offsetWidth bind:offsetHeight id="preview" /> -->

<img src={url} />