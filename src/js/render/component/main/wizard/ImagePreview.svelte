<script lang='js'>
	import { state } from "../../../StateManager";
	import { files } from "../../../FilesManager";
  import { getDocElements } from '../../../editor/map';
	import { isImagePath, isValidHttpUrl } from "../../../../shared/utils";
	import { getLocalPathWithFileScheme } from "../../../editor/editor-utils";
	import { Pos } from "codemirror"
	import { setAsCustomPropOnNode } from "../../ui/actions";

	export let cm = undefined
	export let userSpecifiedUrl = ''
	export let element = undefined
	export let objectFit = 'cover' // or 'cover'
	export let padding = '2px' // px

	let formattedUrl = ''
	let filePath = ''
	let isBlank = false
	let isImage = false
	let isLocal = false
	let isRemote = false
	let isError = false
	let isDraggedOver = false

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

	$: userSpecifiedUrl, update()

	/*
	
	User-specified URLs can be...
	- Local and relative to parent doc:  `../Images/graph.png`
	- Local and relative to project: 		 `/Images/graph.png`
	- Remote: 													 `https://cbc.ca/logo.png`
	
	To load a local URL, we need to format with:
	1) files scheme, and 2) local system path:
	`files:///Users/josh/Desktop/Note/Images/graph.png`
	
	*/
	
	/**
	 * When the user-specified URL changes, format it so we can 
	 * load the file from the local system (if it's a local url).
	 * Or if it's a remote path, do nothing.
	 */
	function update() {

		// If it's blank, return. 
		// We'll show a "missing URL" UI.
		isBlank = userSpecifiedUrl == ''
		if (isBlank) {
			formattedUrl = ''
			return
		}
		
		// If it's not an image path, return.
		// We'll show an "invalid" UI.
		isImage = isImagePath(userSpecifiedUrl)
		if (!isImage) {
			formattedUrl = userSpecifiedUrl
			return
		}

		// Determine if it's local or remote
		isRemote = isValidHttpUrl(userSpecifiedUrl)
		isLocal = !isRemote

		// If it's remote, use without modification
		// If it's local, get working local path with `files` scheme
		if (isRemote) {
			formattedUrl = userSpecifiedUrl
		} else {
			formattedUrl = getLocalPathWithFileScheme(cm, userSpecifiedUrl)
		}	
	}


	/** 
	 * Open this image (if the mark represents an image or figure)
	 * in the Lightbox. Pass the lightbox a list of all the images 
	 * in the current doc (so we can go through them), and the
	 * index of this one.
	 */
	function openImageInLightbox() {

		if (!element) return

		let images = getDocElements(cm).filter((e) => 
			e.type.includesAny('image', 'figure')
		)

		// Find index of this image among all images in the doc.
		const indexOfThisImage = images.findIndex((i) => 
			i.line == element.line && 
			element.start == element.start && 
			i.end == element.end
		)

		// Create array of objects formatted to the needs of
		// `OPEN_LIGHTBOX`. Each with url, title, etc.
		images = images.map((i) => {
			return {
				url: i.spans.find(({type}) => type.includes('url'))?.string,
				text: i.spans.find(({type}) => type.includes('text'))?.string,
				title: i.spans.find(({type}) => type.includes('title'))?.string,
				// cmInstance: cm
			}
		})

		// Filter to only those images with non-empty urls.
		// images = images.filter((i) => i.url)

		// Convert local urls to `file:///` format, so they'll load.
		images.forEach((i) => {
			const isRemote = isValidHttpUrl(i.url)
			if (!isRemote && i.url) {
				i.url = getLocalPathWithFileScheme(cm, i.url)
			}
		})

		// Send to store
		window.api.send('dispatch', {
			type: 'OPEN_LIGHTBOX',
			selectedIndex: indexOfThisImage,
			images,
		})
	}

	/**
	 * If dropped item is file id of an image (e.g. dragged 
	 * from sidebar), then update the url of the element.
	 * 
	*/
	async function onDrop(evt) {
  	const project = window.state.projects.byId[window.id]
		const isFileId = evt.dataTransfer.types.includes('text/mediaid')
		if (isFileId) {
			const id = evt.dataTransfer.getData('text/mediaid')
			const file = $files.byId[id]
			if (file.contentType.includes('image')) {
				
				evt.stopPropagation()
				
				// Remove project directory from path, 
				// and convert spaces to ascii spaces.
				// Before: /Users/josh/Desktop/Notes/Images/Desolation Sound.png
				// After:  /Images/Desolation%20Sound.png
				let url = file.path.replace(project.directory, '')
				url = url.replaceAll(' ', '%20')
				writeNewUrlValue(url)
			}
		}
		isDraggedOver = false
  }

	function writeNewUrlValue(newValue) {

		// Get positions to write new value to.
		// If element.url is missing (meaning url was blank), 
		// we manually set the start and end character values.
		let line = element.line
		let start = element.spans.find((s) => s.type.includes('url'))?.start
		let end = element.spans.find((s) => s.type.includes('url'))?.end
		if (!start) {
			// Manually set values
			// TODO: As is, this is hard coded to work with inline images.
			start = element.markdown.indexOf('](') + 2 + element.start
			end = start
		}
		
		cm.replaceRange(newValue, Pos(line, start), Pos(line, end))
	}

</script>

<style lang="scss">
	@use "src/styles/_helpers" as *;
	
	.imagePreview {
		@include system-small-font;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		box-shadow: none;
		padding: var(--padding);
		overflow: hidden;
	}

	.imagePreview.isBlank::after {
		@include centered-mask-image;
		content: '';
		width: 25px;
		height: 25px;
		-webkit-mask-image: var(--imagepreview-blank-icon);
		background: foregroundColor(0.5);
	}
	
	.imagePreview.isError:not(.isBlank)::after {
		@include centered-mask-image;
		content: '';
		width: 30px;
		height: 30px;
		-webkit-mask-image: var(--imagepreview-error-icon);
		background: foregroundColor(0.5);
	}

	.imagePreview.isDraggedOver {
		@include dragOverAnimation
	}

	.imagePreview:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px accentColor();
		border-radius: 2px;
	}

	img {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		display: block;
		object-fit: var(--objectFit);
		// z-index: -1; 
	}

	// Hide img if there's an error
	.imagePreview.isBlank img,
	.imagePreview.isError img {
		display: none;
	}

</style>

<!-- <iframe id="preview" title="Image" src={url} /> -->

<!-- <div bind:this={element} bind:clientWidth bind:clientHeight bind:offsetWidth bind:offsetHeight id="preview" /> -->

<div 
	class="imagePreview"
	class:isError={isError || !isImage}
	class:isBlank
	class:isDraggedOver
	tabindex={tabindex}
	on:drop={onDrop}
	on:dblclick={openImageInLightbox}
	on:dragenter|preventDefault|stopPropagation
	on:dragover|preventDefault={() => {
		if (!isDraggedOver) isDraggedOver = true
	}}
	use:setAsCustomPropOnNode={{objectFit, padding}}
	on:dragleave|preventDefault={() => isDraggedOver = false}
	on:keydown={(evt) => {
		switch (evt.code) {
			case 'Space': 
				openImageInLightbox(); 
				break;
			case 'Delete': 
			case 'Backspace': 
				writeNewUrlValue('')
				break;
		}
		if (evt.code == 'Space') {
			openImageInLightbox()
		}
	}}
	on:keydown={(evt) => {
		if (evt.code == 'Space') {
			openImageInLightbox()
		}
	}}
>

	<img
		src={formattedUrl} 
		alt={'TODO'}
		on:error={() => isError = true}
		on:load={() => isError = false}
	/>
	<!--data-filename={`${formattedUrl.slice(formattedUrl.lastIndexOf('/') + 1)}`}-->

</div>
