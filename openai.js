import got from 'got'
import { HttpsProxyAgent } from 'https-proxy-agent'
import dotenv from 'dotenv'
import { Logger } from './logger.js'

dotenv.config()

const { http_proxy } = process.env
const L = new Logger('openai')

class OpenAIQuery {
  constructor(
    chatOptions = {
      model: 'text-davinci-002',
      max_tokens: 2048,
      temperature: 0.7,
    }
  ) {
    this.c = chatOptions
    if (http_proxy) L.log(`Using proxy: ${http_proxy}`)
    this.q = got.extend({
      prefixUrl: 'https://api.openai.com/v1/',
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      ...(http_proxy && {
        agent: { https: new HttpsProxyAgent('http://192.168.110.127:7890') },
      }),
      hooks: {
        beforeError: [
          error => {
            const { response } = error
            if (response) {
              error.message = `Request failed with status code ${
                response.statusCode
              }: ${
                response.body?.error?.message ||
                response.body?.error?.code ||
                response.body
              }`
            }
            return error
          },
        ],
      },
    })
  }

  async query(content) {
    try {
      L.log(`Querying: ${content}`)
      const q = await this.q.post('chat/completions', {
        json: {
          ...this.c,
          messages: [{ role: 'user', content }],
        },
      })

      console.log(q.body, q.body.choices[0])
      return q.body
    } catch (error) {
      console.error('Error querying OpenAI API:', error)
      throw 1
    }
  }

  async getModels() {
    try {
      const q = await this.q.get('models')
      return q.body.data
    } catch (error) {
      console.error('Error querying OpenAI API:', error)
      throw 1
    }
  }
}

export { OpenAIQuery }
