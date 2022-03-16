import { exists, stat } from 'fs-extra'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'
import path from 'path'
import mime from 'mime-types'
import { readFile, existsSync } from 'fs-extra'

/**
 * For specified path, return document details
 */
export async function mapDocument(filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await stat(filepath)

	const file = {
		isDoc: true,
		isMedia: false,
		contentType: mime.lookup(filepath), // 'text/markdown', etc
		name: '',
		path: filepath,
		id: `doc-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Markdown-specific --- //
		// title: '',
		// excerpt: '',
		// tags: [],
		// bibliography: {
		// 	path: "",
		// 	exists: false,
		// 	isCslJson: false
		// }
	}

	// If file is markdown, get markdown-specific details
	const isMarkdown = file.contentType == "text/markdown"
	if (isMarkdown) {

		// Get front matter
		const gm = matter.read(filepath)
	
		// Set excerpt
		// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
		file.excerpt = removeMarkdown(gm.content, 350)
	
		// Set fields from front matter (if it exists)
		// gray-matter `isEmpty` property returns "true if front-matter is empty".
		const hasFrontMatter = !gm.isEmpty
		if (hasFrontMatter) {
	
			// If `tags` exists in front matter, use it. Else, set as empty `[]`.
			file.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : []
	
			// If tags is a single string, convert to array
			// We want to support single tag format, ala `tags: Kitten`
			// because it's supported by eleventy: 
			// https://www.11ty.dev/docs/collections/#a-single-tag-cat
			if (typeof file.tags === 'string') {
				file.tags = [file.tags]
			}
	
			// Get bibliography
			file.bibliography = await getBibliography(file, gm.data)
	
		}
	
		// Set title, if present. E.g. "Sea Level Rise"
		file.title = getTitle(gm, path.basename(filepath))
	}

	// Set name from filename (minus file extension)
	file.name = path.basename(filepath)
	// file.name = file.name.slice(0, file.name.lastIndexOf('.'))

	return file
}

/**
 * Set title, in following order of preference:
 * 1. From first h1 in content
 * 2. From `title` field of front matter
 * 3. Leave blank (means no title was found)
 */
function getTitle(graymatter, filename) {

	let titleFromH1 = graymatter.content.match(/^# (.*)$/m)
	if (titleFromH1) {
		return titleFromH1[1]
	} else if (graymatter.data.hasOwnProperty('title')) {
		return graymatter.data.title
	} else {
		return ''
		// return filename.slice(0, filename.lastIndexOf('.'))
	}
}


const blockQuotes = /^> /gm
const bracketedSpans = /:::.*?:::/gm
const citations = /\[@.*?\]/gm

// New lines at start of doc
const newLines = /^\n/gm

// Replace with space:
// - New lines in-line
// - Artifact left from list replacement
// - Extra spaces
const unwantedWhiteSpace = /\n|\t|\s{2,}/gm

/**
 * Return content stripped of markdown characters.
 * And (optionally) trimmed down to specific character length.
 * Per: https://github.com/jonschlinkert/gray-matter#optionsexcerpt
 * @param {*} content 
 * @param {*} trimToLength 
 */
export function removeMarkdown(content, trimToLength = undefined) {

	// Remove h1, if it exists. Currently atx-style only.
	let text = content.replace(/^# (.*)\n/gm, '')

	// If `trimToLength` is defined, do initial trim.
	// We will then remove markdown characters, and trim to final size.
	// We do initial trim for performance purposes: to reduce amount of
	// text that regex replacements below have to process. We add buffer
	// of 100 characters, or else trimming markdown characters could put
	// use under the specified `trimToLength` length.
	if (trimToLength) {
		text = text.substring(0, trimToLength + 100)
	}

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	text = removeMd(text)
		.replace(blockQuotes, '')
		.replace(newLines, '')         // New lines at start of line (usually doc)
		.replace(unwantedWhiteSpace, ' ')
		.replace(bracketedSpans, ' ')
	// .replace(citations, '')

	// If `trimToLength` is defined, trim to final length.
	if (trimToLength) {
		text = text.substring(0, trimToLength)
	}

	return text
}

/**
 * Return the full path to the bibliography file specified, 
 * along with details about it (e.g. does the path work).
 * @param {object} file
 * @param {object} frontmatter - Frontmatter loaded from document
 * @returns Object with absolute path to bibliography, and 
 * booleans for whether 1) it exists, and 2) if it's CSL-JSON
 */
async function getBibliography(file, frontmatter) {

	// If bibliography is not specified, check for bibliography defined in
	// a top-level `data/` directory. 
	if (!frontmatter.bibliography) {
		return { path: "", exists: false, isCslJson: false }
	}

	const absolutePath = path.resolve(path.dirname(file.path), frontmatter.bibliography)
	const exists = await existsSync(absolutePath)
	const isCslJson = path.extname(absolutePath).slice(1).toUpperCase() == "JSON"
	
	// If specified bibliography does not exist, warn
	if (!exists) {
		console.warn(`Bibliography ${frontmatter.bibliography} not found. File name: ${file.name}.`, "— mapDocument.js")
	}

	// If format is not JSON, warn
	// TODO: Validate that the JSON is also CSL-JSON s
	
	// Specified bibliography exists. Return.
	return { path: absolutePath, exists, isCslJson }
}

/**
 * Return JSON object representing aggregate of data found in top-level 
 * "data" directory. Mimimcs Hugo and Eleventy's global
 * data features:
 * - https://www.11ty.dev/docs/data-global/
 * - https://gohugo.io/templates/data-templates/
 * Currently we only support JSON.
 * TODO: 
 * - Support "_data" folder, ala Eleventy 
 * - Support other format. E.g. YAML, TOML, XML.
 */
async function getGlobalData() {
	// Check if directory exists
	// Need to know project directory
	// But functions that call this don't know anything about the project...
	// const dataDirectoryExists = existsSync()
}