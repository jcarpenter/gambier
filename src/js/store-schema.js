import { time_ranges_to_array } from "svelte/internal";

export const StoreSchema = {

  // appStartupTime: {
  //   type: 'string',
  //   default: 'undefined'
  // },

  changed: { type: 'array', default: [] },

  // TODO: For `searchInElement`, add enum of possible elements, matching CodeMirror mode assignments.
  filesSearchCriteria: {
    type: 'object',
    properties: {
      lookInFolderId: { type: 'string', default: '' },
      includeChildren: { type: 'boolean', default: false },
      searchFor: { type: 'string', default: '' },
      searchInElement: { type: 'string', default: '*' },
      matchWholeWord: { type: 'boolean', default: false },
      matchCase: { type: 'boolean', default: false },
      filterDateModified: { type: 'boolean', default: false },
      fromDateModified: { type: 'string', format: 'date-time' },
      toDateModified: { type: 'string', format: 'date-time' },
      filterDateCreated: { type: 'boolean', default: false },
      fromDateCreated: { type: 'string', format: 'date-time' },
      toDateCreated: { type: 'string', format: 'date-time' },
      tags: { type: 'array', default: [] }
    },
    default: {
      lookInFolderId: '',
      includeChildren: false,
      searchFor: '',
      searchInElement: '*',
      matchWholeWord: false,
      matchCase: false,
      filterDateModified: false,
      filterDateCreated: false,
      tags: []
    }
  },

  sideBar: {
    type: 'object',
    properties: {
      show: { type: 'boolean', default: 'true' },
      selectedItemId: { type: 'string', default: '' },
      items: { type: 'array', default: '' },
    },
    default: {
      show: true,
      selectedItemId: '',
      items: [
        { 
          label: 'Files',
          children: [
            {
              label: 'All',
              id: 'all',
              icon: 'images/sidebar-default-icon.svg',
              showFilesList: true,
              filesSearchParams: {},
              lastSelectedFileId: '',
              children: [] 
            },
            {
              label: 'Most Recent',
              id: 'most-recent',
              icon: 'images/folder.svg',
              showFilesList: true,
              filesSearchParams: {},
              lastSelectedFileId: '',
              children: [] 
            }
          ]
        },
        { 
          label: 'Citations',
          children: [
            {
              label: 'Citations',
              id: 'citations',
              icon: 'images/sidebar-default-icon.svg',
              showFilesList: false,
            }
          ]
        }
      ]
    }
  },

  selectedFileId: {
    type: 'string',
    default: '',
  },

  showFilesList: {
    type: 'boolean',
    default: true
  },

  rootFolderId: {
    type: 'string',
    default: ''
  },

  projectPath: {
    descrition: 'User specified path to directory containing their project files',
    type: 'string',
    default: ''
  },

  projectCitations: {
    descrition: 'User specified path to CSL-JSON file containing their citatons',
    type: 'string',
    default: ''
  },

  contents: { type: 'array', default: [] },


  // hierarchy: {
  //   description: 'Snapshot of hierarchy of project directory: files and directories. This is a recursive setup: directories can contain directories. Per: https://json-schema.org/understanding-json-schema/structuring.html#id1. Note: `id` can be anything, but it must be present, or our $refs will not work.',
  //   $schema: "http://json-schema.org/draft-07/schema#",
  //   $id: "anything-could-go-here",
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