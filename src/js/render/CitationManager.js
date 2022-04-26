import convert from "xml-js";
import CSL from "citeproc";


let citeproc // instance of citeproc engine
let style // csl file contents
let locale // locale file contents

// Find citation keys in strings of text. Supports prefix, id, locator, suffix.
// Simple: [@timothy2019]
// Complex: [As written in @timothy2019, pp. 22-25, at least allegedly].
// Demo: https://regex101.com/r/LG0Ipi/1
const citekeyRE = /\[[^\[\]\(\)]*?-?@[a-z0-9_][a-z0-9_:.#$%&\-+?<>~/]*?.*?\](?!\()/gm

// Find components of cite keys (prefix, id, label, locator)
// Does not support suffic yet.
// Demo: https://regex101.com/r/QfLdwI/1
const citekeyComponentsRE = /(?<prefix>[^\n\[\]\(\)]*?)?@(?<id>[a-zA-Z0-9_][^\s,;\]]+)(?:,\s(?<label>[\D]+)\s?(?<locator>[\w\-,:]+))?(?<suffix>.*)?/


/**
 * Setup citation manager.
 * - Load CSL styles
 * - Load locale file
 * - Create citeproc engine instance
 * We only need to do these things once.
 */
export async function init() {

  // Load csl and locale files
  style = await window.api.invoke('getCsl')
  locale = await window.api.invoke('getLocale')

  // Setup citeproc engine
  citeproc = await makeCiteprocEngine()

}


/**
 * For the specified bibliography and citation, return a rendered
 * version of the citation.
 * @param {object} bibliography - Bibliography. Originally loaded from XML file, converted to JSON string, and parsed into as JS object.
 * @param {string} citekey - Markdown of valid citation. E.g. citekey, prefix, locator, suffix, etc.
 */
export async function getRenderedCitation(bibliography, citekey) {

  bibliography.forEach((item) => citeproc.sys.items[item.id] = item)
  citeproc.updateItems(Object.keys(citeproc.sys.items))

  // Get citekey components (prefix, id, etc)
  // Groups return as "According to", "@dole2012", "pp.", "3-4"
  // First use slice to remove enclosing square brackets
  // [@tim2020] --> tim2020
  let {
    prefix = undefined,
    id = '',
    label = '',
    locator = '',
    suffix = '',
  } = citekey.slice(1, citekey.length - 1).match(citekeyComponentsRE)?.groups

  if (label) {

    // If label is present, we need to get the full parent term name, 
    // E.g. the parent term name of "pp." is "page"
    // Citeproc only accepts parent term names (which is annoying)

    // There might be multiple qualifying parent labels. E.g. "page" and "pages" will
    // both return for "@marlee98 page 22". This will usually be because the singular is 
    // subset of the plural, so in these cases, match the plural.
    // Else, if there's only one match, use it.
    const matchingLabels = citeproc.sys.locatorLabels.filter(({ term }) => label.includes(term))
    label = matchingLabels.length > 1 ?
      matchingLabels.find((m) => m.plural).parentTerm :
      matchingLabels[0].parentTerm
  }

  // Remove ugly timestamp locator labels
  // t. 19:31 -> 19.31
  // Demo: https://regex101.com/r/Uh1KAd/2/
  // if (label) label = label.replace(/(t\.|tt\.|times|time)\s?/, '')

  let renderedCitation = citeproc.previewCitationCluster({
    citationItems: [{
      prefix,
      id,
      label,
      locator,
      suffix
    }],
    properties: {
      noteIndex: 0
    }
  }, [], [], 'text')

  // Strip {{html}} and {{/html}} from rendered output
  renderedCitation = renderedCitation.replaceAll(/{{html}}|{{\/html}}/g, "")

  return renderedCitation

}


/**
 * Create instance of the citeproc engine.
 * Load our custom CSL, and the en-US locale.
 * @returns 
 */
async function makeCiteprocEngine() {

  const engine = new CSL.Engine({

    // We'll populate this with citable items
    items: {},

    // An array of valid locator labels. Each formatted as follows:
    // {
    //   term: "p.",
    //   form: "short",
    //   plural: "single",
    //   parentTerm: "page"
    // }
    locatorLabels: getCitationLocatorLabels(locale),

    // Given a language tag in RFC-4646 form, this method retrieves the
    // locale definition file.  This method must return a valid *serialized*
    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
    // processor will fail on a native XML object or buffer).
    retrieveLocale: () => locale,

    // Given an identifier, this retrieves one citation item.  This method
    // must return a valid CSL-JSON object.
    retrieveItem: (id) => {
      return engine.sys.items[id]
    }
  }, style)

  return engine
}


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
 * @param {*} locale: Loaded xml file contents. See CSL repo for full list of locales.
 */
function getCitationLocatorLabels(locale) {

  // Convert XML to JS object.
  // `compact: false` to preserve positions of comments (otherwise they get batched)
  // `trim: true` to remove white space.
  const localeJs = convert.xml2js(locale, { compact: false, trim: true, spaces: 4 })
  // const localeJs = convert.xml2js(locale, { compact: false, trim: true, spaces: 4 })

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