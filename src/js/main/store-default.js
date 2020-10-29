import { makeSideBarItem } from './sideBar/makeSideBarItem'

const storeDefault = {

  // ----------- APP ----------- //

  // App theme. See Readme.
  appearance: {
    userPref: 'match-system',
    theme: 'gambier-light'
  },


  // ----------- WINDOW ----------- //

  // User specified path to folder containing their project files
  projectPath: '',

  // User specified path to CSL-JSON file containing their citatons
  projectCitations: '',


  focusedLayoutSection: 'navigation',

  // A copy of the object of the document currently visible in the editor.
  openDoc: {},

  // A copy of the object of the selected `sideBar` item. We use a copy for the sake of convenience. It saves us having to continually find the original `sideBar` item, which would be tricky, as `sideBar` items don't have unique IDs (we instead use a heuristic based on id names).
  selectedSideBarItem: {},

  showFilesList: true,

  // SideBar
  sideBar2: {
    show: true,
    activeTab: {
      index: 0,
      name: "project"
    },
    tabs: [
      {
        title: 'Project', name: 'project',
        lastSelectedItem: 0,
        selectedItems: [],
        expandedItems: [],
      },
      {
        title: 'All Documents', name: 'all-documents',
        lastSelectedIndex: 0,
        selectedItems: [],
      },
      {
        title: 'Most Recent', name: 'most-recent',
        lastSelectedIndex: 0,
        selectedItems: [],
      },
      {
        title: 'Tags', name: 'tags',
        lastSelectedIndex: 0,
        selectedItems: [],
      },
      {
        title: 'Media', name: 'media',
        lastSelectedIndex: 0,
        selectedItems: [],
      },
      {
        title: 'Citations', name: 'citations',
        lastSelectedIndex: 0,
        selectedItems: [],
      },
      {
        title: 'Search', name: 'search',
        lastSelectedIndex: 0,
        selectedItems: [],
      }
    ],
  },

  // Contents
  folders: [],
  documents: [],
  media: [],


  // ----------- PANEL / TAB ----------- //

  panels: [],

  panel1: {
    tabs: []
  },

  sourceMode: false,




  // ----------- OLD ----------- //

  // SideBar
  sideBar: {
    show: true,
    folders: [],
    documents: [
      makeSideBarItem('filter', 'All', 'docs-all', '', 'images/sidebar-default-icon.svg', true,
        {
          lookInFolderId: '*',
          includeChildren: true,
          filetypes: ['.md', '.markdown'],
          tags: [],
          dateModified: { use: false, from: '', to: '' },
          dateCreated: { use: false, from: '', to: '' },
        },
        { by: 'title', order: 'ascending' }),
      makeSideBarItem('filter', 'Favorites', 'docs-favs', '', 'images/sidebar-default-icon.svg', true,
        {
          lookInFolderId: '*',
          includeChildren: true,
          filetypes: ['.md', '.markdown'],
          tags: ['favorite'],
          dateModified: { use: false, from: '', to: '' },
          dateCreated: { use: false, from: '', to: '' },
        },
        { by: 'title', order: 'ascending' }),
      makeSideBarItem('filter', 'Most Recent', 'docs-mostRecent', '', 'images/sidebar-default-icon.svg', true,
        {
          lookInFolderId: '*',
          includeChildren: true,
          filetypes: ['.md', '.markdown'],
          tags: [],
          dateModified: { use: true, from: 'NOW', to: '7-DAYS-AGO' },
          dateCreated: { use: false, from: '', to: '' },
        },
        { by: 'date-modified', order: 'ascending' })
    ],
    media: [
      makeSideBarItem('filter', 'All', 'media-all', '', 'images/sidebar-default-icon.svg', true)
    ],
    citations: [],
  }

}

export { storeDefault }