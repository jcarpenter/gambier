/**
 * Get locator value from citekey.
 * Input:   `[@book-UninhabitEarth, pages 201-204]`
 * Returns: `201-204`
 */
function getValue(citekey, label) {
  // First remove whitespace. Specifically we want to remove
  // possible spaces between label and value.
  // Before: `[@book-UninhabitEarth, pagess 201-204]`
  // After: `[@book-UninhabitEarth,pages201-204]`
  this.citekey = citekey.replace(/\s/g, "")

  // Then cut off everything until end of label
  // After: `201-204]`
  this.citekey = this.citekey.substring(this.citekey.indexOf(label) + label.length)

  // Then find end of value. We check against multiple characters.
  // search() returns index of matching character.
  const endOfValue = this.citekey.search(/]|,|}/)

  // And return the value
  return this.citekey.substring(0, endOfValue)
}

/**
 * Get citation locator (value and label) from citekey.
 * Input: `[@web-NuclearPowerChina-19, pages 45-48]`
 * Return: `{ label: "page", value: "45-48" }`
 * @param {string} citekey.
 * @param {array} locators - Array of valid locators, as defined by the locale.
 */
module.exports = (citekey, locators) => {

  // Locators are always preceded by a space.
  // If there are no spaces in the citekey, return. 
  if (!citekey.includes(" ")) return false

  // Check if citekey contains a valid locator term
  // E.g. [@web-NuclearPowerChina-19, p.19] matches `p.` locator
  // If no, return
  const matchFound = locators.find((l) => citekey.includes(l.term)) 
  if (!matchFound) return false
  
  // Check if there are multiple matching locators. 
  // For example, `[@book-Sunrise, page 22]` would match `page` and `pages`.
  // This will usually be because the singular is subset of the plural,
  // so in these cases, match the plural.
  // Else, if there's only one match, use it.
  const matches = locators.filter((l) => citekey.includes(l.term))  
  if (matches.length > 1) {
    var locator = matches.find((m) => m.plural)
  } else {
    var locator = matches[0]
  }

  // Get locator "parentTerm"
  // E.g. "pp." term => "page" parentTerm
  const label = locator.parentTerm
  const value = getValue(citekey, locator.term)

  return { label: label, value: value }
}

