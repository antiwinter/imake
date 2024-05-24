import fs from 'fs'
import path from 'path'
import { cwd } from 'process'

const db = {}

async function scan() {
  const ignores = new Set()

  // Read ignore files
  ;['.gitignore', '.imkignore'].forEach((f) => {
    try {
      fs.readFileSync(path.join(cwd(), f), 'utf8')
        .split('\n')
        .forEach((line) => {
          if (line.trim() && !line.startsWith('#')) {
            ignores.add(line.trim())
          }
        })
    } catch (err) {}
  })

  // Generate origin_doc string
  let text = ''
  let time = 0
  fs.readdirSync(path.join(cwd(), 'seed')).forEach((f) => {
    // FIXME: the file need to match the pattern in the ignores,
    // it may not directly equal to one of the keys
    if (f.endsWith('.md') && !ignores.has(f)) {
      time = Math.max(time, fs.statSync(path.join(cwd(), 'seed', f)).mtimeMs)
      text +=
        `DOC: ${f}\n\n` +
        fs.readFileSync(path.join(cwd(), 'seed', f), 'utf8') +
        '\n'
    }
  })

  db.seed = {
    time,
    text,
    desc: '',
  }
  db.entry = {}

  // Save path of all code files
  // FIXME: this should be scan in a recursive way
  fs.readdirSync(cwd()).forEach((f) => {
    if (
      f.match(/\.(js|ts|py|html|css|c|cpp|h|hpp|md)$/i) &&
      // FIXME: the file need to match the pattern in the ignores,
      // it may not directly equal to one of the keys
      !ignores.has(f)
    ) {
      const p = path.join(cwd(), f)
      const stats = fs.statSync(p)
      db.entry[p] = {
        time: stats.mtimeMs,
        text: fs.readFileSync(p, 'utf8'),
        desc: '',
      }
    }
  })
}

import { OpenAIQuery } from './openai.js'

async function generateDesignDoc() {
  const df = './.imk/design.md'
  let text
  if (!fs.existsSync(df) || fs.statSync(df).mtimeMs < db.seed.time) {
    text = await regenerateDesignDoc()
    fs.writeFileSync(df, text, 'utf8')
  } else {
    text = fs.readFileSync(df, 'utf8')
  }

  return text
}

async function regenerateDesignDoc() {
  const openAI = new OpenAIQuery(/* config */)
  const prompt = `Generate a design document based on the following content:\n\n${db.origin_doc}`
  const response = await openAI.query(prompt)
  return response
}
