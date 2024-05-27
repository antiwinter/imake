import fs from 'fs'
import path from 'path'
import { cwd } from 'process'
import { Logger } from './logger.js'
import { OpenAIQuery } from './openai.js'
import { assert } from 'console'

const openAI = new OpenAIQuery(/* config */)

const L = new Logger('imk')
const db = {}

async function loadDesc(p, d, t) {
  try {
    assert(fs.statSync(`./.imk/${p}.desc`).mtimeMs > d.time)
    d.desc = fs.readFileSync(`./.imk/${p}.desc`, 'utf8')
  } catch (err) {
    d.desc = await openAI.query(t)
    L.log(`Generated design doc for ${p}`)
    fs.writeFileSync(`./.imk/${p}.desc`, d.desc)
  }
}

async function scan() {
  const ignores = new Set()

  // Read ignore files
  ;['.gitignore', '.imkignore'].forEach(f => {
    try {
      fs.readFileSync(path.join(cwd(), f), 'utf8')
        .split('\n')
        .forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            ignores.add(line.trim())
          }
        })
    } catch (err) {}
  })

  // Generate origin_doc string
  let text = ''
  let time = 0
  fs.readdirSync(path.join(cwd(), 'seed')).forEach(f => {
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

  db.$seed = { time, text }
  await loadDesc(
    'seed',
    db.$seed,
    `Generate a design document based on the following content:\n${text}`
  )

  // Save path of all code files
  // FIXME: this should be scan in a recursive way
  fs.readdirSync(cwd()).forEach(async f => {
    if (
      f.match(/\.(js|ts|py|html|css|c|cpp|h|hpp|md)$/i) &&
      // FIXME: the file need to match the pattern in the ignores,
      // it may not directly equal to one of the keys
      !ignores.has(f)
    ) {
      const p = path.join(cwd(), f)
      const stats = fs.statSync(p)
      db[p] = {
        time: stats.mtimeMs,
        text: fs.readFileSync(p, 'utf8'),
      }
      await loadDesc(
        p,
        db[p],
        `please generate a description file of this code, 
        removing any implementing details, leaving only classes, 
        functions and arguments, with a concise description
        to each class, function and argument
        you do not make any comment on my question,
        but output the content directly.`
      )
    }
  })
}
