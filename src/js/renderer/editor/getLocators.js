const convert = require('xml-js')

/**
 * Get valid locators from the provided locale file.
 * Locale files specify the valid terms (locator and otherwise), for the locale.
 * See: https://docs.citationstyles.org/en/stable/specification.html#locators
 * for the list of valid locator terms in the CSL spec.
 * Each locators can also have multiple short, long, singular and pluralized versions.
 * E.g. "page" can be written as "p." (short, singlular), "pages" (long, multiple), etc.
 * Locators are specified in the locale files as follows:
 * ```
 * <term name="page" form="short">
 *    <single>p.</single>
 *    <multiple>pp.</multiple>
 * </term>
 * ```
 * We extract these from the locale file, and return an array of objects, where
 * each object is a unique locator term (e.g. "p."), in the following format:
 * ```
 * {
 *   term: "p.",
 *   form: "short",
 *   plural: "single",
 *   parentTerm: "page"
 * }
 * ```
 * @param {*} locale: xml file. See CSL repo for full list: 
 */
module.exports = (locale) => {

  // Convert XML to JS object.
  // `compact: false` to preserve positions of comments (otherwise they get batched)
  // `trim: true` to remove white space.
  const localeJs = convert.xml2js(locale, { compact: false, trim: true, spaces: 4 })

  // Get "terms" array. 
  // Yes, this is ugly; log localeJs to console to see the hierarchy.
  const allTerms = localeJs.elements[0].elements.find((e) => e.name == "terms").elements

  // Find all locator terms from "terms" array.
  // This is a PITA because terms is flat, and the XML comments are the only demarcations,
  // e.g. <!-- LONG LOCATOR FORMS --> and <!-- SHORT LOCATOR FORMS -->, which prececed
  // lists of terms, respectively (long, short, and symbol). The following logic looks 
  // for those, and starts adding the items that follow, up until the next comment block.
  // If that comment block is also a LOCATOR block, it keeps on adding. Else, it stops.
  let locatorTerms = []
  let isLocator = false
  allTerms.map((t) => {

    if (isLocator) {
      if (t.type !== "comment")
        locatorTerms.push(t)
    } 
    
    if (t.type == "comment") {
      if (t.comment.includes("LOCATOR")) {
        isLocator = true
      } else {
        isLocator = false
      }
    }
  })

  // Build array of objects. This is what we'll return.
  // One object per locator.
  let locators = []

  locatorTerms.map((l) => {
    
    // Skip "number-of-pages" locators.
    // `locales-en-US` includes them, but they're not in the official list:
    // https://docs.citationstyles.org/en/stable/specification.html#locators
    // ...and they're identical to `pages`, causing needless parsing confusion.
    if (l.attributes.name == "number-of-pages") return

    // In source locale, term `form` attribute is either missing, or `form="short"`.
    // E.g. https://github.com/citation-style-language/locales/blob/master/locales-en-US.xml#L166
    // Hence the ternary operators for `form` key, below:

    // Get singular version
    let singleVersion = {
      term: l.elements[0].elements[0].text,
      form: l.attributes.form ? l.attributes.form : "long",
      plural: false,
      parentTerm: l.attributes.name
    }

    // Get pluralized version
    let multipleVersion = {
      term: l.elements[1].elements[0].text,
      form: l.attributes.form ? l.attributes.form : "long",
      plural: true,
      parentTerm: l.attributes.name
    }

    locators.push(singleVersion, multipleVersion)
  })

  // Sort locators alphabetically. They're
  locators.sort((a, b) => (a.term > b.term) ? 1 : -1)

  return locators
}
