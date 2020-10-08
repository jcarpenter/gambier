import { makeSideBarItem } from './sideBar/makeSideBarItem'

const storeDefault = {

  focusedLayoutSection: 'navigation',

  // A copy of the object of the document currently visible in the editor.
  openDoc: {},

  // A copy of the object of the selected `sideBar` item. We use a copy for the sake of convenience. It saves us having to continually find the original `sideBar` item, which would be tricky, as `sideBar` items don't have unique IDs (we instead use a heuristic based on id names).
  selectedSideBarItem: {},

  showFilesList: true,
  sourceMode: false,

  // App theme. See Readme.
  theme: 'gambier-light',

  // User specified path to folder containing their project files
  projectPath: '',

  // User specified path to CSL-JSON file containing their citatons
  projectCitations: '',

  // Contents
  folders: [],
  documents: [],
  media: [],
  contents: [],

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
        dateModified: { use: false, from: '',to: '' },
        dateCreated: { use: false, from: '', to: '' },
      },
      { by: 'title', order: 'ascending' }),
      makeSideBarItem('filter', 'Favorites', 'docs-favs', '', 'images/sidebar-default-icon.svg', true, 
      {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: ['favorite'],
        dateModified: { use: false, from: '',to: '' },
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