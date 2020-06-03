export const StoreSchema = {

  appStartupTime: {
    type: 'string',
    default: 'undefined'
  },
  
  projectDirectory: {
    descrition: 'User specified directory that contains their project files',
    type: 'string',
    default: 'undefined'
  },

  lastOpenedFileId: {
    description: 'id of the last opened file.',
    type: 'integer',
    default: 0
  },

  selectedFolderId: {
    type: 'integer',
    default: 0
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