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

export { hasChanged, mountReplace }