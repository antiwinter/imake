import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'fs'
import path from 'path'
import { Logger } from './logger.js'
import { OpenAIQuery } from './openai.js'

const logger = new Logger('imk')

async function resume() {
  const outputPath = path.join(process.cwd(), 'out')
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath)
  }
  const files = readdirSync(outputPath)
  return {
    hasPreviousSession: files.length > 0,
    files,
  }
}

async function improveDocs(resumes, ignores) {
  const markdownFiles = readdirSync(process.cwd()).filter(
    (file) => file.endsWith('.md') && !ignoredPaths.has(file)
  )

  // fixme: using GPT4, use maximum tokens
  const openAI = new OpenAIQuery()
  const docs = '' // content of all docs
  // FIXME: if resumed, skip the already processed files
  const improvePrompts = markdownFiles.map((file) => {
    const content = readFileSync(path.join(process.cwd(), file), 'utf8')
    return openAI.query(`You're going to improve the content of ${file}
        according to the original design docs. improve the clarity and
        detail of the documentation, ensuring logical consistency and completeness.
        You output the file content directly without any preceding comments..\n\n${docs}`)
  })

  // TODO: output summary:  [imk] 14 docs found, 2384 tokens
  const improvements = await Promise.all(improvePrompts)
  const outDir = path.join(process.cwd(), 'out')
  if (!existsSync(outDir)) {
    mkdirSync(outDir)
  }

  improvements.forEach((improved, index) => {
    const originalFile = markdownFiles[index]
    const improvedPath = path.join(outDir, originalFile)
    writeFileSync(improvedPath, improved.response)
  })

  // FIXME: this summary is about comparing the original and improved files
  // and output a summary of the improvements
  const summaryPath = path.join(outDir, 'summary-doc.md')
  const summaryContent = improvements
    .map(
      (imp, index) =>
        `## ${markdownFiles[index]}\nOriginal Tokens: ${imp.uploadedTokenCount}` +
        `k, Improved Tokens: ${imp.generatedTokenCount}k\n`
    )
    .join('\n')
  writeFileSync(summaryPath, summaryContent)
  logger.log('Document summary generated.')

  return improvements.map((x) => {
    ;`${x.response}\n\n`
  })
}

// todo: this involves getting all the pathes and content of the coding files,
// e.g. .js, .ts, .py, .html, .css, .c, .cpp, .h, .hpp, etc.
// then ask the LLM to generate an improved structure of the code files
// by providing the docs and pathes and contents,
// also their content summaries, and the relationship between them.
// these summaries should include essential functions, classes, variables, etc.
// then the generated code files should be saved in the out directory,
// with each summary as a comment at the beginning of the file.
async function genStructure(llm, docs, ignoredPaths) {
  const codeFileExtensions = /\.(js|ts|py|html|css|c|cpp|h|hpp)$/i
  const allFiles = readdirSync(process.cwd())
  const codeFiles = allFiles.filter(
    (file) => file.match(codeFileExtensions) && !ignoredPaths.has(file)
  )

  const fileContents = codeFiles.map((file) => ({
    path: file,
    content: readFileSync(path.join(process.cwd(), file), 'utf8'),
  }))

  const structurePrompt = `Given the following code files and their contents,
    along with detailed documentation improvements: ${docs.join('\n\n')}
  Files and contents:
  ${fileContents
    .map((f) => `File: ${f.path}\nContent:\n${f.content}`)
    .join('\n\n')}
  Generate a refined project structure and provide summaries for each code file,
  including essential functions, classes, variables, and their relationships.
  Output the results in JSON format, where keys are file paths and values are summaries.
  Add another key named 'summary-structure.md' whose value clarifies what changes were made and why.`

  const structureResult = await llm.query(structurePrompt)
  const results = JSON.parse(structureResult.response)

  const outDir = path.join(process.cwd(), 'out', 'structure')
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  // Write summaries and code structure changes to files
  Object.entries(results).forEach(([filePath, summary]) => {
    if (filePath === 'summary-structure.md') {
      const summaryPath = path.join(outDir, filePath)
      writeFileSync(summaryPath, summary)
    } else {
      const fullPath = path.join(outDir, filePath)
      const content = `/*\n${summary}\n*/\n\n${
        fileContents.find((f) => f.path === filePath).content
      }`
      writeFileSync(fullPath, content)
    }
  })

  logger.log('Structure document and code summaries generated.')
}

async function make() {
  const { hasPreviousSession, files } = await resume()
  if (hasPreviousSession) {
    logger.log('Resuming previous session...')
  } else {
    logger.log('Starting new session...')
  }

  const ignoreFiles = ['.gitignore', '.imkignore']
  const ignoredPaths = new Set()

  ignoreFiles.forEach((file) => {
    const ignoreFilePath = path.join(process.cwd(), file)
    if (existsSync(ignoreFilePath)) {
      const content = readFileSync(ignoreFilePath, 'utf8')
      content.split('\n').forEach((line) => {
        if (line.trim() && !line.startsWith('#')) {
          ignoredPaths.add(line.trim())
        }
      })
    }
  })

  const docs = await improveDocs(files, ignoredPaths)
  const codeFiles = await genStructure(docs)

  // TODO: gen code file one by one by providing the docs, the pathes and contents
}

export { make }
