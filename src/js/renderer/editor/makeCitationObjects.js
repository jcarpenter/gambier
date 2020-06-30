/**
 * Build an array of citations in CSL format. 
 * Per: https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html#citations
 * For each citation, returns object (locator and label optional), ala:
 * ```
 * {
*   citationItems: [
*     {
*       id: "ITEM-1",
*       label: "page",
*       locator: "45-60"
*      }
*   ],
*   properties: {
*     noteIndex: 0
*   }
* }
 * ```
 * @return Array of citataion objects in CSL format
 */
module.exports = (data, locators) => {

  let citations = []

  data.map((c) => {
    let citation = {
      citationItems: [
        {
          id: c.id
        }
      ],
      properties: {
        noteIndex: 0
      }
    }

    if (c.locatorLabel) citation.citationItems[0]["label"] = c.locatorLabel
    if (c.locatorValue) citation.citationItems[0]["locator"] = c.locatorValue

    citations.push(citation)
  })

  return citations
}

