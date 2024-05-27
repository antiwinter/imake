import fs from 'fs'
import { join } from 'path'
import { cwd } from 'process'
import { Logger } from './logger.js'
import { OpenAIQuery } from './openai.js'

const openAI = new OpenAIQuery(/* config */)
const L = new Logger('imk')
const db = {}
const ignores = []

// Read ignore files
;['.gitignore', '.imkignore'].forEach(f => {
  try {
    ignores.push(
      ...fs
        .readFileSync(join(cwd(), f), 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => new RegExp(line.trim()))
    )
  } catch (err) {}
})

async function loadDesc(p, d, t) {
  const descPath = join(cwd(), '.imk', `${p}.desc`)
  try {
    assert(fs.statSync(descPath).mtimeMs > d.time)
    d.desc = fs.readFileSync(descPath, 'utf8')
  } catch (err) {
    d.desc = await openAI.query(t)
    L.log(`Generated desc ${p}`)
    fs.writeFileSync(descPath, d.desc)
  }
}

async function scanDirectory(dir, callback) {
  for (const f of fs.readdirSync(dir)) {
    const filePath = join(dir, f)
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      await scanDirectory(filePath, callback)
    } else if (!ignores.some(i => i.test(filePath))) {
      callback(filePath, stats)
    }
  }
}

async function scan() {
  // Generate origin_doc string
  let text = ''
  let time = 0
  await scanDirectory(join(cwd(), 'seed'), (filePath, stats) => {
    if (filePath.endsWith('.md')) {
      time = Math.max(time, stats.mtimeMs)
      text +=
        `DOC: ${path.basename(filePath)}\n\n` +
        fs.readFileSync(filePath, 'utf8') +
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
  await scanDirectory(cwd(), async (filePath, stats) => {
    if (filePath.match(/\.(js|ts|py|html|css|c|cpp|h|hpp|md)$/i)) {
      db[filePath] = {
        time: stats.mtimeMs,
        text: fs.readFileSync(filePath, 'utf8'),
      }
      await loadDesc(
        filePath,
        db[filePath],
        `Please generate a description file of this code...`
      )
    }
  })
}

scan().then(() => L.log('Scanning complete.'))
