/**
 * Pass dynamic values to CSS through CSS variables.
 * From: https://www.kirillvasiltsov.com/writing/unlocking-the-power-of-svelte-actions/
 * @param {*} node 
 * @param {*} properties - Name of CSS variable we want to set
 */
export function css(node, properties) {
  function setProperties() {
    for (const prop of Object.keys(properties)) {
      node.style.setProperty(`--${prop}`, properties[prop]);
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

import { tooltip } from '../../StateManager'

export function setTooltip(node, text) {

  function onMouseEnter(evt) {
    tooltip.set({
      status: 'show',
      text: text,
      x: evt.clientX,
      y: evt.clientY + 4
    })
  }

  function onMouseDown() {
    tooltip.set({
      status: 'hide',
      text: '',
      x: 0,
      y: 0
    })
  }

  function onMouseLeave(evt) {
    tooltip.set({
      status: 'hideAfterDelay',
      text: '',
      x: 0,
      y: 0
    })
  }

  node.addEventListener('mouseenter', onMouseEnter);
  node.addEventListener('mousedown', onMouseDown);
  node.addEventListener('mouseleave', onMouseLeave);

  return {
    destroy() {
      node.removeEventListener('mouseenter', onMouseEnter);
      node.removeEventListener('click', onMouseDown);
      node.removeEventListener('mouseleave', onMouseLeave);
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

  function onDrop(evt) {
    // const type = file.type == '' ? 'folder' : file.type.includes('markdown') ? 'doc' : undefined
    if (isFolder) {
      node.classList.remove('isDraggedOver')
      const file = evt.dataTransfer.files[0]
      window.api.send('dispatch', {
        type: 'DRAG_INTO_FOLDER',
        filePath: file.path,
        folderPath: folderPath
      })
    }
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

// const listItemProps = {
//   id: '', 
//   tabId: '', 
//   tab: {}, 
//   listIds: [], 
//   isSelected: false
// }

// export function listItem(node, props = { ...listItemProps }) {

//   function handleMousedown(evt) {

//     console.log(props)

//     // Shift-click: Select range of items in list
//     // Click while not selected: Make this the only selected item
//     // Cmd-click while not selected: Add this to existing items
//     // Cmd-click while selected: Remove this from existing items

//     const shiftClicked = evt.shiftKey
//     const clickedWhileSelected = !evt.metaKey && props.isSelected
//     const clickedWhileNotSelected = !evt.metaKey && !props.isSelected
//     const cmdClickedWhileNotSelected = evt.metaKey && !props.isSelected
//     const cmdClickedWhileSelected = evt.metaKey && props.isSelected

//     let selected = []

//     if (clickedWhileSelected) {
//       return
//     } else if (shiftClicked) {
//       const clickedIndex = props.listIds.indexOf(props.id)
//       const lastSelectedIndex = props.listIds.indexOf(props.tab.lastSelected)
//       const lastSelectedIsStillVisible = lastSelectedIndex !== -1
//       if (!lastSelectedIsStillVisible) {
//         // If last selected item is no longer visible (e.g. parent 
//         // folder may have closed), select only this id.
//         selected = [props.id]
//       } else {
//         // Else, select all items between the last selected, and this id.
//         const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex)
//         const selectToIndex = Math.max(clickedIndex, lastSelectedIndex)
//         const newSelected = props.listIds.slice(selectFromIndex, selectToIndex + 1)
//         const lastSelected = [...props.tab.selected]
//         selected = [...newSelected, ...lastSelected]
//       }
//     } else if (clickedWhileNotSelected) {
//       selected = [props.id]
//     } else if (cmdClickedWhileNotSelected) {
//       selected = [props.id, ...props.tab.selected]
//     } else if (cmdClickedWhileSelected) {
//       // Copy array and remove this item from it
//       selected = [...props.tab.selected]
//       const indexToRemove = selected.indexOf(props.id)
//       selected.splice(indexToRemove, 1)
//     }

//     // If there are multiple selected, find and remove any duplicates.
//     // Per: https://stackoverflow.com/a/14438954
//     if (selected.length > 1) {
//       selected = Array.from(new Set(selected))
//     }

//     window.api.send('dispatch', {
//       type: 'SIDEBAR_SET_SELECTED',
//       tabId: props.tabId,
//       lastSelected: props.id,
//       selected: selected,
//     })
//   }

//   node.addEventListener('mousedown', handleMousedown);

// 	return {
//     update(newProps) {
//       props = newProps
//     },
// 		destroy() {
// 			node.removeEventListener('mousedown', handleMousedown);
// 		}
// 	};
// }