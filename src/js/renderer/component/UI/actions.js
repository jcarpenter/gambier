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

export function flash(element) {
	requestAnimationFrame(() => {
		element.style.transition = 'none';
		element.style.color = 'rgba(255,62,0,1)';
		element.style.backgroundColor = 'rgba(255,62,0,1)';
		element.style.outline = '4px solid black';

		setTimeout(() => {
			element.style.transition = 'color 1s, background 1s, outline 1s';
			element.style.color = '';
			element.style.backgroundColor = '';
			element.style.outline = '';
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