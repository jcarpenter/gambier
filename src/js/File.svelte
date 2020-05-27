<script>
    export let name;
    $: nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
</script>

<style>
	/* div {
        border-top: 1px solid rgba(0, 0, 0, 0.2);
	} */
</style>

<div>{nameWithoutExt}</div>