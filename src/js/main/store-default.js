import { makeItem } from './sideBar/makeItem'

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
      makeItem('filter', 'All', 'docs-all', '', 'images/sidebar-default-icon.svg', true, {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: [],
        filterDateModified: false,
        fromDateModified: '',
        toDateModified: '',
      }),
      makeItem('filter', 'Favorites', 'docs-favs', '', 'images/sidebar-default-icon.svg', true, {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: ['favorite'],
        filterDateModified: false,
        fromDateModified: '',
        toDateModified: '',
      }),
      makeItem('filter', 'Most Recent', 'docs-mostRecent', '', 'images/sidebar-default-icon.svg', true, {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: [],
        filterDateModified: true,
        fromDateModified: 'today',
        toDateModified: '7-days-ago',
      })
    ],
    media: [
      makeItem('filter', 'All', 'media-all', '', 'images/sidebar-default-icon.svg', true,)
    ],
    citations: [],
  }

}

export { storeDefault }