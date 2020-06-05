/**
 * Get citation id from citekey.
 * Examples of supported formats:
 * *  `[@web-NuclearPowerChina-19]`
 * *  `[@conf-LightsOutClimate-18, p.16]` (with locator)
 * @param {*} string: Citekey.
 */
module.exports = (string) => {

  // We expect id to start after `@`
  let from = string.indexOf("@") + 1

  // We expect id to end with a comma or space (if there's a locator), 
  // or a "]", if there is not.
  let to = string.indexOf(",")
  if (to === -1) to = string.indexOf(" ")
  if (to === -1) to = string.indexOf("]")

  // Log an error if either value is -1 (match not found).
  if (from === -1 || to === -1) {
    console.log(`getCitationKey: Cannot extract id from string, ${string}. Ids must start with @ and end with space, comma, or ].`)
    return
  }

  return string.slice(from, to)
}
