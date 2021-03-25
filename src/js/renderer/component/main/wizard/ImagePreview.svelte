<script>
	import { files } from "../../../FilesManager";

	export let url = null
	export let cm = null

	let formattedUrl
	let isLocalUrl

	$: url, formatURL()

	/**
	 * If `url` is relative, get working absolute url 
	 * of file in the project directory.
	 */
	function formatURL() {
		if (!cm || !url) return
		const project = window.state.projects.byId[window.id]
		const doc = $files.byId[cm.panel.docId]
		const docURL = new URL(`file://${doc.path}`)
		formattedUrl = new URL(url, docURL)
		isLocalUrl = formattedUrl.protocol == 'file:'
	}

</script>

<style type="text/scss">
	img,
	#preview {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		object-fit: contain;
	}
</style>

<!-- <iframe id="preview" title="Image" src={url} /> -->

<!-- <div bind:this={element} bind:clientWidth bind:clientHeight bind:offsetWidth bind:offsetHeight id="preview" /> -->

<img src={formattedUrl} />