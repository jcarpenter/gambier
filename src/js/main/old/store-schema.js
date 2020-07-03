export const StoreSchema = {

  changed: { type: 'array', default: [] },

  focusedLayoutSection: {
    type: 'string',
    default: 'navigation',
  },

  openDoc: {
    type: 'object',
    default: {}
  },

  selectedSideBarItemId: {
    type: 'string',
    default: '',
  },

  showFilesList: {
    type: 'boolean',
    default: true
  },

  projectPath: {
    descrition: 'User specified path to folder containing their project files',
    type: 'string',
    default: ''
  },

  projectCitations: {
    descrition: 'User specified path to CSL-JSON file containing their citatons',
    type: 'string',
    default: ''
  },

  sideBar: {
    $id: 'sideBar',
    
    // Definitions
    definitions: {
      item: {
        type: 'object',
        properties: {
          label: { type: 'string', default: 'Godzilla' },
          searchParams: { $ref: '#/definitions/searchParams' }
        },
        required: ['label', 'searchParams']
      },
      searchParams: {
        type: 'object',
        properties: {
          lookInFolderId: { type: 'string' },
          includeChildren: { type: 'boolean', default: false },
          filterDateModified: { type: 'boolean', default: false },
          filterDateModified: { type: 'boolean', default: true },
          fromDateModified: { type: 'string', format: 'date-time' },
          toDateModified: { type: 'string', format: 'date-time' },
          tags: { type: 'array', default: [] }
        },
      }
    },

    // Schema
    type: 'object',
    properties: {
      show: { type: 'boolean', default: true },
      folders: {
        type: 'array',
        items: { $ref: '#/definitions/item' },
        default: [
          {
            label: 'Mothra',
          },
          {
            label: 'Megaladon',
          }
        ]
      }
    },
    default: {}

      // -------- Folders -------- //
      // folders: {
      //   type: 'array',
      //   default: [
      //     {
      //       label: '',
      //       id: '',
      //       parentId: 'folders-group',
      //       type: 'folder',
      //       icon: 'images/folder.svg',
      //       showFilesList: true,
      //       searchParams: {
      //         lookInFolderId: 'root',
      //         includeChildren: false,
      //         filterDateModified: false,
      //       },
      //       selectedFileId: '',
      //       lastScrollPosition: 0,
      //       lastSelection: [],
      //       expanded: true
      //     },
      //   ]
      // },

      //   // -------- Documents -------- //
      //   documents: {
      //     type: 'array',
      //     default: [
      //       {
      //         label: 'All',
      //         id: 'all',
      //         parentId: 'docs-group',
      //         type: 'filter',
      //         icon: 'images/sidebar-default-icon.svg',
      //         showFilesList: true,
      //         searchParams: {
      //           lookInFolderId: 'root',
      //           includeChildren: true,
      //         },
      //         selectedFileId: '',
      //         lastScrollPosition: 0,
      //         lastSelection: [],
      //       },
      //       {
      //         label: 'Favorites',
      //         id: 'favorites',
      //         parentId: 'docs-group',
      //         type: 'filter',
      //         icon: 'images/sidebar-default-icon.svg',
      //         showFilesList: true,
      //         searchParams: {
      //           lookInFolderId: 'root',
      //           includeChildren: true,
      //           tags: ['favorite']
      //         },
      //         selectedFileId: '',
      //         lastScrollPosition: 0,
      //         lastSelection: [],
      //       },
      //       {
      //         label: 'Most Recent',
      //         id: 'most-recent',
      //         parentId: 'docs-group',
      //         type: 'filter',
      //         icon: 'images/sidebar-default-icon.svg',
      //         showFilesList: true,
      //         searchParams: {
      //           lookInFolderId: 'root',
      //           includeChildren: true,
      //           filterDateModified: true,
      //           fromDateModified: 'today',
      //           toDateModified: '7-days-ago'
      //         },
      //         selectedFileId: '',
      //         lastScrollPosition: 0,
      //         lastSelection: [],
      //       },
      //     ]
      //   },

      //   // -------- Media -------- //
      //   media: {
      //     type: 'array',
      //     default: [
      //       {
      //         label: 'Media',
      //         id: 'media-all',
      //         parentId: 'media-group',
      //         type: 'other',
      //         icon: 'images/sidebar-default-icon.svg',
      //         showFilesList: false,
      //         lastScrollPosition: 0,
      //         lastSelection: [],
      //       }
      //     ]
      //   },

      //   // -------- Citations -------- //
      //   citations: {
      //     type: 'array',
      //     default: [
      //       {
      //         label: 'Citations',
      //         id: 'citations',
      //         parentId: 'citations-group',
      //         type: 'other',
      //         icon: 'images/sidebar-default-icon.svg',
      //         showFilesList: false,
      //         lastScrollPosition: 0,
      //         lastSelection: [],
      //       }
      //     ]
      //   },
  },

  folders: { 
    type: 'array', 
    default: [] 
  },

  documents: { 
    type: 'array', 
    default: [] 
  },

  media: { 
    type: 'array', 
    default: [] 
  },

  contents: { 
    type: 'array', 
    default: [] 
  },

  // TODO: For `searchInElement`, add enum of possible elements, matching CodeMirror mode assignments.
  // filesSearchCriteria: {
  //   type: 'object',
  //   properties: {
  //     lookInFolderId: { type: 'string', default: '' },
  //     includeChildren: { type: 'boolean', default: false },
  //     searchFor: { type: 'string', default: '*' },
  //     searchInElement: { type: 'string', default: '*' },
  //     matchWholeWord: { type: 'boolean', default: false },
  //     matchCase: { type: 'boolean', default: false },
  //     filterDateModified: { type: 'boolean', default: false },
  //     fromDateModified: { type: 'string', format: 'date-time' },
  //     toDateModified: { type: 'string', format: 'date-time' },
  //     filterDateCreated: { type: 'boolean', default: false },
  //     fromDateCreated: { type: 'string', format: 'date-time' },
  //     toDateCreated: { type: 'string', format: 'date-time' },
  //     tags: { type: 'array', default: [] }
  //   },
  //   default: {
  //     lookInFolderId: '',
  //     includeChildren: false,
  //     searchFor: '',
  //     searchInElement: '*',
  //     matchWholeWord: false,
  //     matchCase: false,
  //     filterDateModified: false,
  //     filterDateCreated: false,
  //     tags: []
  //   }
  // },

  // appStartupTime: {
  //   type: 'string',
  //   default: 'undefined'
  // },

  // hierarchy: {
  //   description: 'Snapshot of hierarchy of project directory: files and directories. This is a recursive setup: directories can contain directories. Per: https://json-schema.org/understanding-json-schema/structuring.html#id1. Note: `id` can be anything, but it must be present, or our $refs will not work.',
  //   $schema: 'http://json-schema.org/draft-07/schema#',
  //   $id: 'anything-could-go-here',
  //   definitions: {
  //     'fileOrDirectory': {
  //       type: 'object',
  //       required: ['typeOf', 'name', 'path'],
  //       properties: {
  //         typeOf: { type: 'string', enum: ['File', 'Directory'] },
  //         name: { type: 'string' },
  //         path: { type: 'string' },
  //         created: { type: 'string', format: 'date-time' },
  //         modified: { type: 'string', format: 'date-time' },
  //         children: {
  //           type: 'array',
  //           items: { $ref: '#/definitions/fileOrDirectory' }
  //         }
  //       }
  //     }
  //   },
  //   type: 'array',
  //   items: { $ref: '#/definitions/fileOrDirectory' },
  //   default: []
  // }
}