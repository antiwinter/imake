// openai.js
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

class OpenAIQuery {
  constructor(model = "text-davinci-002", maxTokens = 2048, temperature = 0.7) {
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.configuration = new Configuration({
      apiKey: this.apiKey,
    });
    this.openai = new OpenAIApi(this.configuration);
  }

  async query(prompt) {
    try {
      const response = await this.openai.createCompletion({
        model: this.model,
        prompt: prompt,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      // TODO: output [model-name] ..... [tokens] [cost] information

      const result = {
        response: response.data.choices[0].text.trim(),
        uploadedTokenCount: Math.ceil(prompt.length / 4), // Simplified estimation
        generatedTokenCount: Math.ceil(
          response.data.choices[0].text.length / 4
        ), // Simplified estimation
        cost: this.calculateCost(response.data.usage.total_tokens),
      };

      return result;
    } catch (error) {
      console.error("Error querying OpenAI API:", error);
      throw error;
    }
  }

  calculateCost(tokenCount) {
    // Example cost calculation: \$0.002 per token
    return (tokenCount * 0.002) / 1000;
  }
}

export { OpenAIQuery };
