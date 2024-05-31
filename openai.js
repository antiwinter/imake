import { HttpsProxyAgent } from 'https-proxy-agent'
import dotenv from 'dotenv'
import { logger } from 'autils'
import { OpenAI } from 'openai'

dotenv.config()

const log = logger()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const { http_proxy } = process.env
log(`Using proxy: ${http_proxy}`)
const opt = { httpAgent: http_proxy && new HttpsProxyAgent(http_proxy) }

export function createAgent(
  model = 'gpt-3.5-turbo',
  max_tokens = 2048,
  temperature = 0.7
) {
  let a = {
    async query(content, cb) {
      log('query:', content.length)
      let q = await openai.chat.completions.create(
        {
          model,
          messages: [{ role: 'user', content }],
          temperature,
          max_tokens,
          stream: true,
        },
        opt
      )

      for await (const c of q) {
        let txt = c.choices[0]?.delta?.content || ''
        log(txt)
        if (cb) cb(txt)
      }
    },
  }

  return a
}

export async function listModels() {
  log('listing')
  return await openai.models.list(opt)
}
