import { HttpsProxyAgent } from 'https-proxy-agent'
import dotenv from 'dotenv'
import { logger } from 'autils'
import { OpenAI } from 'openai'
import { get_encoding } from 'tiktoken'

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

      let t = 0
      for await (const c of q) {
        let txt = c.choices[0]?.delta?.content || ''
        // log(c.choices[0]?.delta, c)
        t++
        if (cb) cb(txt)
      }

      return t
    },
    estimate(i, o) {
      // calculate the estimated cost
      let e = get_encoding('gpt2')
      i = e.encode(i).length
      o = e.encode(o).length
      let cost = (i * 5 + o * 15) / 1000000
      return { i, o, cost }
    },
  }

  return a
}

export async function listModels() {
  log('listing')
  return await openai.models.list(opt)
}
