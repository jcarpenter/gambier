import Database from 'better-sqlite3'

export class DbManager {
  constructor() {
  }

  init() {

    // Create Database object.
    // Pass ":memory:" as the first argument to create an in-memory db.
    global.db = new Database(':memory:', { verbose: console.log })
    const createTable = global.db.prepare('CREATE VIRTUAL TABLE docs USING FTS5(id, name, title, body)')
    createTable.run()
    
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