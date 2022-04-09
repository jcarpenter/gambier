<script lang='js'>
	import IconButton from "../ui/IconButton.svelte";
	import AddressBar from "./AddressBar.svelte";

	function todo() {
		// TODO
	}
		
</script>

<style lang="scss">
	#address-bar {
    -webkit-app-region: drag;
		width: 100%;
		height: 40px;
		flex: none;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0 5px;
		overflow: hidden;
		position: relative;
	}
	
</style>

<div id="address-bar">
	<IconButton tooltip={'Show sidebar'} icon={'img-sidebar-left'} on:mousedown={todo} />
	<AddressBar />
	<IconButton icon={'img-rectangle-grid-2x2'} on:mousedown={todo} />
</div>