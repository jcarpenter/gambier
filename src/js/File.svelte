<script>
    export let title
    export let path

    function holler() {
        window.api.send('dispatch', { type: 'OPEN_FILE', fileName: path })
    }
</script>

<style type="text/scss">
	/* div {
        border-top: 1px solid rgba(0, 0, 0, 0.2);
	} */
</style>

<div on:click={holler}>{title}</div>