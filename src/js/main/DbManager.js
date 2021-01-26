import Database from 'better-sqlite3'
import { ipcMain } from 'electron'

export class DbManager {
  constructor() {

    // Create database
    // Pass ":memory:" as the first argument to create an in-memory db.
    this.db = new Database(':memory:')
    // this.db = new Database(':memory:', { verbose: console.log })

    // Create table
    this.table = this.db.prepare(`
      CREATE VIRTUAL TABLE docs 
      USING FTS5(id, name, title, path, body)
    `).run()

    // Statement for inserting new docs

    // Using `INSERT OR REPLACE` means we replace the row, if it already exists. Else, we create (insert) it. 

    // The following says: "Does a row with the same id already exist? If yes, get it's rowid. And insert the new values at that same rowid, thereby replacing the original row. Else, insert a new row." `rowid` is a unique integer index value automatically assigned to each row on creation, in FTS tables (or any sqlite table where we don't specify a primary key).

    // This is all a bit convuluted. That's because we're using FTS tables. Normally we could jusy, say, set the `id` column as the primary key, and sqlite would automatically trigger the replace action if we tried to add a row with the same id. But FTS tables don't allow primary key declaration or constraints (the other tool we could use). So instead we have to insert at specific rowid's, ala working with arrays by indexes.
    this.insert_stmt = this.db.prepare(`
      INSERT OR REPLACE INTO docs (rowid, id, name, title, path, body) 
      VALUES ((SELECT rowid FROM docs WHERE id = @id LIMIT 1), @id, @name, @title, @path, @body)
    `)

    this.insert_many_stmt = this.db.transaction((docs) => {
      for (const doc of docs) {
        this.insert_stmt.run(doc)
      };
    });

    this.delete_stmt = this.db.prepare(`
      DELETE FROM docs
      WHERE id = ?
      LIMIT 1
    `)

    // Statement for full text search
    this.fts_stmt = this.db.prepare(`
      SELECT id,
             title,
             highlight(docs, 4, '<span class="highlight">', '</span>') body
      FROM docs 
      WHERE docs MATCH ?
      ORDER BY rank
    `)

    // Setup listener to handle queries from renderer. Take the provided paramaters for query string (e.g. 'dogs'), matchExactPhrase (boolean), and path (e.g. '/User/Documents/ClimateResearch'), and create the string we'll pass into 

    // We use column filters to specify which columns to search. We only want params.path to search the `path` column, for example. And we never want to search `id` column. For example: `body: "Rex" *` says "Search body column for tokens that start with 'Rex'`. Per: https://www.sqlite.org/fts5.html#fts5_column_filters

    // If `matchExactPhrase` is false, we add a '*' after our query string, which tells sqlite to treat the string as a "prefix token", and match any tokens that start with the query. Per: https://www.sqlite.org/fts5.html#fts5_prefix_queries

    // For `path`, we're inserting `^` before the string, to tell sqlite to only match if the string starts at the first token in the column. Like ^ works in regex. Per: https://www.sqlite.org/fts5.html#fts5_initial_token_queries

    // We wrap our strings in double-quotation marks to escape characters such as - and /, which would otherwise trigger sql errors. Forward slashes will always appear in paths, and other characters may appear in the query string.

    // We use boolean operators to combine our phrases. Matches MUST be descendants of the specified `params.path` (folder path), AND have query matches in either `body`, `title`, or `name` columns.

    // Docs: https://www.sqlite.org/fts5.html#extending_fts5
    ipcMain.handle('queryDb', (evt, params) => {

      // Create the query string
      const body = `body:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`
      const title = `title:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`
      const name = `name:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`
      const path = `path:^ "${params.path}"${params.matchExactPhrase ? '' : ' *'}`
      const query = `${path} AND (${body} OR ${title} OR ${name})`

      // Run the full text search statement with the query string.
      let results = this.fts_stmt.all(query)

      // Return the results. Will be array of objects; one for each row.
      return results
    })
  }

  /**
   * Insert single row into database.
   */
  insert(doc = {
    id: '',
    name: '',
    title: '',
    path: '',
    body: ''
  }) {
    this.insert_stmt.run(doc)
  }

  /**
   * Insert multiple rows into the database.
   * @param {} docs - Array of docs
   */
  insertMany(docs) {
    this.insert_many_stmt(docs)
  }

  /**
   * Delete single row from database.
   */
  delete(id) {
    this.delete_stmt.run(id)
  }

  init() {

    // const insertTest = global.db.prepare('INSERT INTO docs (title, path) VALUES (?, ?)')
    // const info = insertTest.run("My time in Tuscany", "Was mostly unremarkable, to be perfectly honest.")
    // console.log(info.changes)

    // const insert = global.db.prepare('INSERT INTO docs (id, name, title, body) VALUES (?, ?, ?, ?)');

    // const insertMany = global.db.transaction((data) => {
    //   for (const item of data) {
    //     insert.run(item)
    //   }
    // });

    // insertMany([
    //   { title: 'Joey', path: 'docs/joey.md' },
    //   { title: 'Sally', path: 'docs/salley.md' },
    //   { title: 'Junior', path: 'docs/junior.md' },
    // ]);

    // const joey = global.db.prepare('SELECT * FROM docs WHERE title = ?').get('Junior')
    // console.log(joey)

    // const deleteTest = global.db.prepare('DELETE FROM docs WHERE title = ?').run("Sally")

    // const getAll = global.db.prepare('SELECT * FROM docs')
    // console.log(getAll.all())

    // const updateTest = global.db.prepare('UPDATE docs SET title = ? WHERE title = ?').run('Zelda!', 'Joey')

    // console.log(getAll.all())
  }
}