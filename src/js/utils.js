const htmlRE = new RegExp(/<\/?[a-z][\s\S]*>/)

/**
 * Check if string contains HTML. Uses regexp from StackOverflow:
 * https://stackoverflow.com/a/15458987
 */
function containsHTML(string) {
  return htmlRE.test(string)
}

const urlRE = new RegExp(/^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i)

/**
 * Check if string is URL. Uses regexp from GitHub Flavored Markdown:
 * https://github.com/codemirror/CodeMirror/blob/master/mode/gfm/gfm.js#L14
 */
function isUrl(string) {
  return urlRE.test(string)
}

/**
 * Check if values of two object keys do not match.
 */
function hasChanged(key, newState, oldState) {
  return newState[key] !== oldState[key]
}

/**
 * Replace targets, instead of appending to them (the default).
 * From: https://github.com/sveltejs/svelte/issues/1549#issuecomment-397819063
 * @param {*} Component - To be rendered
 * @param {*} options - For the component (e.g. target)
 */
function mountReplace(Component, options) {
  const frag = document.createDocumentFragment();
  const component = new Component({ ...options, target: frag });

  options.target.parentNode.replaceChild(frag, options.target);

  return component;
}

export { mountReplace, hasChanged, isUrl, containsHTML }