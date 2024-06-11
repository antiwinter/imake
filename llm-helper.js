import { createAgent, listModels } from './openai.js'

function prompt() {
  let p = {
    txt: '',
    attach(t, name) {
      p.txt += '\n\n'
      if (name) p.txt += `${name}:\n`
      p.txt += t
      return p
    },
    d() {
      p.txt +=
        'You output the file content directly without commenting my questions.'
    },
    async run(cb) {
      return await ag.query(p.txt, cb)
    },
  }
  return p
}

export function createHelper() {
  let h = {
    agent: createAgent(),
    async genCode(target, doc, sums) {
        let p = prompt(`
        `)
    },
    async genDoc(docs) {
      let p = prompt(`
      You're going to improve the content of the attached files and output a single file.
      The output doc is going to be used as the design doc of a software, so you should: 
        1. improve the clarity, ensuring logical consistency and completeness
        2. adding details and examples where necessary
        3. removing redundant information
      `).d()

      for (let k in docs) p.attach(docs[k], k)
      return await p.run()
    },
    async fnInfo(fn) {
      return await prompt(`
      You're going to be given a snippet of code with line numbers and you need to
      find the function ${fn} including its preceding comments and the function signature.
      Then you output the starting and ending line numbers of the function in the format
      of json: "{start: number, end: number}"`)
        .d()
        .run()
    },
    async loadIgnores() {
      return await loadIgnores()
    },
    async scanDirectory(dir, callback) {
      return await scanDirectory(dir, callback)
    },
  }

  return h
}
