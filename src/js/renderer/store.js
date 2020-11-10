import { writable, derived, get } from "svelte/store";

// export function restoreStateOnColdStart(state) {
//   if (state.index) index.set(state.index)
//   if (state.projectPath) projectPath.set(state.projectPath)
//   if (state.focusedLayoutSection) focusedLayoutSection.set(state.focusedLayoutSection)
//   if (state.sidebar) sidebar.set(state.sidebar)
// }

export const windowId = writable(0)
export const projectPath = writable('')
export const focusedLayoutSection = writable('sidebar')

export const sidebar = writable({
  isOpen: true,
  previewIsOpen: true,
  width: 250,
  activeTab: 'project',
  tabs: [
    {
      title: 'Project', name: 'project',
      lastSelectedItem: {}, // id and type
      selectedItems: [], // Array of ids
      expandedItems: [], // Array of folder ids
    },
    {
      title: 'All Documents', name: 'all-documents',
      lastSelectedItem: {},
      selectedItems: [],
    },
    {
      title: 'Most Recent', name: 'most-recent',
      lastSelectedItem: {},
      selectedItems: [],
    },
    {
      title: 'Tags', name: 'tags',
      lastSelectedItem: {},
      selectedItems: [],
    },
    {
      title: 'Media', name: 'media',
      lastSelectedItem: {},
      selectedItems: [],
    },
    {
      title: 'Citations', name: 'citations',
      lastSelectedItem: {},
      selectedItems: [],
    },
    {
      title: 'Search', name: 'search',
      lastSelectedItem: {},
      selectedItems: [],
    }
  ]
})

export const dispatch = (action, payload) => {
  switch (action) {
    case "TOGGLE_SIDEBAR":
      sidebar.update(sidebar => ({ ...sidebar, isOpen: !sidebar.isOpen }))
      break
    case "SET_WIDTH":
      sidebar.update(sidebar => ({ ...sidebar, width: payload }))
      break
    case 'SELECT_SIDEBAR_TAB_BY_NAME':
      sidebar.update(sidebar => ({ ...sidebar, activeTab: payload }))
      break
  }
};

export const stateAsObject = derived([windowId, projectPath, focusedLayoutSection, sidebar],
  ([$windowId, $projectPath, $focusedLayoutSection, $sidebar]) => ({
    windowId: $windowId,
    projectPath: $projectPath,
    focusedLayoutSection: $focusedLayoutSection,
    sidebar: $sidebar
  }))

stateAsObject.subscribe(state => {
  window.api.send('saveProjectStateToDisk', state, state.windowId)
})

// export function getStateAsObject()
// {
//   return {
//     focusedLayoutSection: get(focusedLayoutSection),
//     sidebar: get(sidebar),
//   }
// }







// function redux(init, reducer) {
//   // const devTools =
//   //   window.__REDUX_DEVTOOLS_EXTENSION__ &&
//   //   window.__REDUX_DEVTOOLS_EXTENSION__.connect();

//   const { update, subscribe } = writable(init);

//   function dispatch(action) {
//     update(state => {
//       // devTools.send(action, state);
//       return reducer(state, action);
//     });
//   }

//   return {
//     subscribe,
//     dispatch
//   };
// }

// const reducer = (state, action) => {
//   // console.log(state.count, action);
//   switch (action.type) {
//     case "SIDEBAR_TOGGLE":
//       return { 
//         ...state,
//         sidebarIsOpen: !state.sidebarIsOpen 
//       };
//     default:
//       return state;
//   }
// };

// export function dispatch(action) {
//   update(state => {
//     // devTools.send(action, state);
//     return reducer(state, action);
//   });
// }

// export const store = redux(initialState, reducer);
