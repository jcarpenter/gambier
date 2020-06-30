import { stat } from 'fs-extra'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'

export default async function (path, data) {

  const file = {}
  
  // Set path
  file.path = path

	// Get stats
	const stats = await stat(path)

	// Set fields from stats
	file.id = `file-${stats.ino}`
	file.modified = stats.mtime.toISOString()
	file.created = stats.birthtime.toISOString()

	// Get front matter
	const gm = matter(data)

	// Set excerpt
	// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
	file.excerpt = getExcerpt(gm.content)

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	if (!gm.isEmpty) {
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		file.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : []
	}

	// Set name (includes extension). E.g. "sealevel.md"
	file.name = path.substring(path.lastIndexOf('/') + 1)

	// Set title. E.g. "Sea Level Rise"
	file.title = getTitle(gm, file.name)

	return file
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