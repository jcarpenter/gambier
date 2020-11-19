import { stat } from 'fs-extra'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'
import path from 'path'
import { getMediaType } from '../../shared/utils'

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
	doc.excerpt = getExcerpt(gm.content)

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	const hasFrontMatter = !gm.isEmpty
	if (hasFrontMatter) {
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		doc.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : []
	}

	// Set title. E.g. "Sea Level Rise"
	doc.title = getTitle(gm, path.basename(filepath))
	doc.name = doc.title

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
 * 3. From filename, minus extension
 */
function getTitle(graymatter, filename) {

	let titleFromH1 = graymatter.content.match(/^# (.*)$/m)
	if (titleFromH1) {
		return titleFromH1[1]
	} else if (graymatter.data.hasOwnProperty('title')) {
		return graymatter.data.title
	} else {
		return filename.slice(0, filename.lastIndexOf('.'))
	}
}

/**
 * Return excerpt from content, stripped of markdown characters.
 * Per: https://github.com/jonschlinkert/gray-matter#optionsexcerpt
 * @param {*} file 
 */
function getExcerpt(content) {

	// Remove h1, if it exists. Then trim to 200 characters.
	let excerpt = content
		.replace(/^# (.*)\n/gm, '')
		.substring(0, 400)

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	excerpt = removeMd(excerpt)
		.replace(/^> /gm, '')         // Block quotes
		.replace(/^\n/gm, '')         // New lines at start of line (usually doc)
		.replace(/\n/gm, ' ')         // New lines in-line (replace with spaces)
		.replace(/\t/gm, ' ')         // Artifact left from list replacement
		.replace(/\[@.*?\]/gm, '')    // Citations
		.replace(/:::.*?:::/gm, ' ')  // Bracketed spans
		.replace(/\s{2,}/gm, ' ')     // Extra spaces
		.substring(0, 200)            // Trim to 200 characters

	return excerpt
}