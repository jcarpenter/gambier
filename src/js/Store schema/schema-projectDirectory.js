// This is a recursive setup: directories can contain directories.
// See: https://json-schema.org/understanding-json-schema/structuring.html#id1
// `id` can be anything, but it must be present, or our $refs will not work.
export const ProjectDirectorySchema = {
  contents: {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "anything-could-go-here",
    definitions: {
      'fileOrDirectory': {
        type: 'object',
        required: ['typeOf', 'name', 'path'],
        properties: {
          typeOf: { type: 'string', enum: ['File', 'Directory'] },
          name: { type: 'string' },
          path: { type: 'string' },
          created: { type: 'string', format: 'date-time' },
          modified: { type: 'string', format: 'date-time' },
          children: {
            type: 'array',
            items: { $ref: '#/definitions/fileOrDirectory' }
          }
        }
      }
    },
    type: 'array',
    items: { $ref: '#/definitions/fileOrDirectory' }
  }
}