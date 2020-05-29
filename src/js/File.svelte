<script>
    export let name
    export let path

    $: nameWithoutExt = name.slice(0, name.lastIndexOf('.'));

    function holler() {
        window.api.send('dispatch', { type: 'OPEN_FILE', fileName: path })
    }
</script>

<style type="text/scss">
	/* div {
        border-top: 1px solid rgba(0, 0, 0, 0.2);
	} */
</style>

<div on:click={holler}>{nameWithoutExt}</div>