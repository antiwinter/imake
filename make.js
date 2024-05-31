import fs from 'fs/promises'
import { join } from 'path'
import { cwd } from 'process'
import { logger } from 'autils'
import { OpenAIQuery } from './openai.js'

const openAI = new OpenAIQuery(
  {
    model: 'gpt-4o-2024-05-13',
    max_tokens: 2048,
    temperature: 0.7,
  },
  { host: '192.168.110.127', port: 7890 }
)

const log = logger()
const db = {}
const ignores = []

async function loadIgnores() {
  for (const f of ['.gitignore', '.imkignore']) {
    try {
      const content = await fs.readFile(join(cwd(), f), 'utf8')
      ignores.push(
        ...content
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(
            line =>
              new RegExp(line.trim().replace('.', '\\.').replace('*', '.*'))
          )
      )
    } catch (err) {
      // Log error or handle it if needed
    }
  }
}

async function loadDesc(p, d, t) {
  const descPath = join(cwd(), '.imk', `${p}.desc`)
  try {
    const stats = await fs.stat(descPath)
    if (stats.mtimeMs > d.time) {
      d.desc = await fs.readFile(descPath, 'utf8')
    }
  } catch (err) {
    d.desc = await openAI.query(t)
    log(`Generated desc for ${p}:`, d.desc)
    // create prceeding folders if descPath if not exists
    await fs.mkdir(join(descPath, '..'), { recursive: true })
    await fs.writeFile(descPath, d.desc)
  }
}

async function scanDirectory(dir, callback) {
  const files = await fs.readdir(dir)
  for (const f of files) {
    const filePath = join(dir, f)
    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        await scanDirectory(filePath, callback)
      } else if (!ignores.some(i => i.test(filePath))) {
        await callback(filePath, stats)
      }
    } catch (err) {
      // Log error or handle it if needed
    }
  }
}

async function scan() {
  await loadIgnores()

  // Generate origin_doc string
  let text = ''
  let time = 0
  await scanDirectory(join(cwd(), 'IDEAS'), async (filePath, stats) => {
    log(filePath, stats.mtimeMs)
    if (filePath.endsWith('.md')) {
      //   console.log(await fs.readFile(filePath, 'utf8'))
      time = Math.max(time, stats.mtimeMs)
      text +=
        `DOC: ${filePath}\n\n` + (await fs.readFile(filePath, 'utf8')) + '\n'
      //   console.log(text)
    }
  })

  //   console.log('ttt', text)
  //   return
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
        text: await fs.readFile(filePath, 'utf8'),
      }
      await loadDesc(
        filePath,
        db[filePath],
        `please generate a description file of this code,
        removing any implementing details, leaving only classes,
        functions and arguments, with a concise description to
        each class, function and argument. you do not make any
        comment on my question, but output the content directly
        
        CODE: ${db[filePath].text}`
      )
    }
  })
}

scan().then(() => log('Scanning complete.'))
