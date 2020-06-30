import removeMd from 'remove-markdown'

export default function(file) {

  // gray-matter passes extract function the file.
  // file.contents give us the input string, with front matter stripped.

  // Remove h1, if it exists. Then trim to 200 characters.
  let excerpt = file.content
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

  file.excerpt = excerpt
}