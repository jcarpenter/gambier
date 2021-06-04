/**
 * Write CSS custom property values to style attribute of `node`.
 * E.g. If `properties` is `wizardOffset` and value is 5, node
 * is rendered as <div style="--wizardOffset: 5;">.
 * 
 * From: https://www.kirillvasiltsov.com/writing/unlocking-the-power-of-svelte-actions/
 * @param {*} node - DOM element to write custom properties to.
 * @param {objet} properties - E.g.: `{ wizardOffset: 5,  bounceScale: 2 }.`
 */
export function setAsCustomPropOnNode(node, properties) {
  function setProperties() {
    for (const customPropertyName of Object.keys(properties)) {
      node.style.setProperty(`--${customPropertyName}`, properties[customPropertyName]);
    }
  }

  setProperties();

  return {
    update(newProperties) {
      properties = newProperties;
      setProperties();
    },
  };
}


/**
 * For the given array of values, set the margin on the node (in px).
 * @param {*} values - Array of values. Same format as normal css values. E.g. '5px 0' or '100%'.
 */
export function setSize(node, props) {

  function setStyles({ width, minWidth, height, margin, padding }) {
    node.style.width = width;
    node.style['min-width'] = minWidth;
    node.style.height = height;
    node.style.margin = margin;
    node.style.padding = padding;  
  }

  setStyles(props)

  return {
    update(newProps) {
      setStyles(newProps)
    },
  };
}

export function setPosition(node, params) {
  const { x, y } = params
  node.style.top = y
  node.style.left = x
}

/**
 * 
 * @param {*} node 
 * @param {*} sectionName 
 */
export function setLayoutFocus(node, params) {

  let { current, setTo } = params

  function onClick() {
    if (current !== setTo) {
      window.api.send('dispatch', { type: 'SET_LAYOUT_FOCUS', section: setTo })
    }
  }

  node.addEventListener('click', onClick)

  return {
    update(newParams) {
      current = newParams.current
      setTo = newParams.setTo
    },
    destroy() {
      node.removeEventListener('click', onClick);
    }
  }
}


export function dragIntoFolder(node, properties) {

  const { isFolder, folderPath } = properties

  // on:dragover|preventDefault|stopPropagation={() => { isDraggedOver = true }}
  // on:dragleave|preventDefault|stopPropagation={() => { isDraggedOver = false }}
  // on:drop|preventDefault|stopPropagation={drop}

  function onDragOver(evt) {
    evt.preventDefault()
    if (isFolder) {
      node.classList.add('isDraggedOver')
    }
  }

  function onDragLeave(evt) {
    evt.preventDefault()
    if (isFolder) {
      node.classList.remove('isDraggedOver')
    }
  }

  /**
   * Copy or move the dropped file into the folder
   * @param {*} evt 
   */
  function onDrop(evt) {
    evt.preventDefault()
    if (isFolder) {
      const file = evt.dataTransfer.files[0]
      // TODO 3/21: Update this to new `invoke` version
      window.api.send('moveOrCopyIntoFolder', file.path, folderPath, evt.altKey)
    }
    node.classList.remove('isDraggedOver')
  }

  node.addEventListener('dragover', onDragOver);
  node.addEventListener('dragleave', onDragLeave);
  node.addEventListener('drop', onDrop);

  return {
    destroy() {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    }
  }
}


// TODO: Can remove. Just have here as an example ofusing requestAnimationFrame.
export function flash(node) {
  requestAnimationFrame(() => {
    node.style.transition = 'none';
    node.style.color = 'rgba(255,62,0,1)';
    node.style.backgroundColor = 'rgba(255,62,0,1)';
    node.style.outline = '4px solid black';

    setTimeout(() => {
      node.style.transition = 'color 1s, background 1s, outline 1s';
      node.style.color = '';
      node.style.backgroundColor = '';
      node.style.outline = '';
    });
  });
}
