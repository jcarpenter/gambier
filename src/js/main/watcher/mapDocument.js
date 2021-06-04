import { stat } from 'fs-extra'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'
import path from 'path'

/**
 * For specified path, return document details
 */
export async function mapDocument (filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await stat(filepath)

	const doc = {
		type: 'doc',
		name: '',
		path: filepath,
		id: `doc-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Doc-specific --- //
		title: '',
		excerpt: '',
		tags: [],
	}	

	// Get front matter
	const gm = matter.read(filepath)

	// Set excerpt
	// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
	doc.excerpt = removeMarkdown(gm.content, 350)

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	const hasFrontMatter = !gm.isEmpty
	if (hasFrontMatter) {
		
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		doc.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : []
		
		// If tags is a single string, convert to array
		// We want to support single tag format, ala `tags: Kitten`
		// because it's supported by eleventy: 
		// https://www.11ty.dev/docs/collections/#a-single-tag-cat
		if (typeof doc.tags === 'string') {
			doc.tags = [doc.tags]
		}
	}

	// Set title, if present. E.g. "Sea Level Rise"
	doc.title = getTitle(gm, path.basename(filepath))

	// Set name from filename (minus file extension)
	doc.name = path.basename(filepath)
	doc.name = doc.name.slice(0, doc.name.lastIndexOf('.'))

	return doc

	// if (oldVersion !== undefined) {
	//   const lhs = Object.assign({}, oldVersion)
	//   const rhs = file
	//   diff.observableDiff(lhs, rhs, (d) => {
	//     if (d.kind !== 'D') {
	//       diff.applyChange(lhs, rhs, d)
	//     }
	//   })
	//   return lhs
	// } else {
	// }
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
