import { greeting, sayHelloTo } from './test-2.js'
import * as config from './config.js'
import csl from 'citeproc'
import * as fse from 'fs-extra'

console.log(config.demoFile)
console.log(csl)
console.log(fse)
console.log(sayHelloTo("Josh"))