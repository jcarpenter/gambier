import { makeSideBarItem } from './sideBar/makeSideBarItem'

function makeProject() {

  return {
    // User specified path to folder containing their project files
    path: '',

    // User specified path to CSL-JSON file containing their citatons
    citations: '',

    focusedLayoutSection: 'navigation',

    // A copy of the object of the document currently visible in the editor.
    openDoc: {},

    // SideBar
    sidebar: {
      isOpen: true,
      width: 250,
      activeTabName: "project",
      previewIsOpen: true,
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
      ],
    },
  }
}


export const storeDefault = {

  // ----------- APP ----------- //

  // App theme. See Readme.
  appearance: {
    userPref: 'match-system',
    theme: 'gambier-light'
  },

  isColdStart: false,


  // ----------- PROJECTS ----------- //

  projects: []



  // // Contents
  // folders: [],
  // documents: [],
  // media: [],


  // ----------- PANEL / TAB ----------- //

  // panels: [],

  // panel1: {
  //   tabs: []
  // },

  // sourceMode: false,




  // ----------- OLD ----------- //

  // SideBar
  // sideBar: {
  //   show: true,
  //   folders: [],
  //   documents: [
  //     makeSideBarItem('filter', 'All', 'docs-all', '', 'images/sidebar-default-icon.svg', true,
  //       {
  //         lookInFolderId: '*',
  //         includeChildren: true,
  //         filetypes: ['.md', '.markdown'],
  //         tags: [],
  //         dateModified: { use: false, from: '', to: '' },
  //         dateCreated: { use: false, from: '', to: '' },
  //       },
  //       { by: 'title', order: 'ascending' }),
  //     makeSideBarItem('filter', 'Favorites', 'docs-favs', '', 'images/sidebar-default-icon.svg', true,
  //       {
  //         lookInFolderId: '*',
  //         includeChildren: true,
  //         filetypes: ['.md', '.markdown'],
  //         tags: ['favorite'],
  //         dateModified: { use: false, from: '', to: '' },
  //         dateCreated: { use: false, from: '', to: '' },
  //       },
  //       { by: 'title', order: 'ascending' }),
  //     makeSideBarItem('filter', 'Most Recent', 'docs-mostRecent', '', 'images/sidebar-default-icon.svg', true,
  //       {
  //         lookInFolderId: '*',
  //         includeChildren: true,
  //         filetypes: ['.md', '.markdown'],
  //         tags: [],
  //         dateModified: { use: true, from: 'NOW', to: '7-DAYS-AGO' },
  //         dateCreated: { use: false, from: '', to: '' },
  //       },
  //       { by: 'date-modified', order: 'ascending' })
  //   ],
  //   media: [
  //     makeSideBarItem('filter', 'All', 'media-all', '', 'images/sidebar-default-icon.svg', true)
  //   ],
  //   citations: [],
  // }

}