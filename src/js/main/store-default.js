import { makeSideBarItem } from './sideBar/makeSideBarItem'

const storeDefault = {

  focusedLayoutSection: 'navigation',

  openDoc: {},

  selectedSideBarItem: {},

  showFilesList: true,

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