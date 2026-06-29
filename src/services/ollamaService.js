const axios = require('axios');
const ollamaConfig = require('../config/ollama');

class OllamaService {
  constructor() {
    this.baseURL = ollamaConfig.baseURL;
    this.defaultModel = ollamaConfig.defaultModel;
    this.timeout = ollamaConfig.timeout;
  }

  /**
   * Generate text using Ollama. Automatically continues if output is cut off
   * due to token/context limits (done_reason === "length").
   */
  async generateText(prompt, model = null, options = {}) {
    try {
      const modelName = model || this.defaultModel;
      const maxTokens =
        options.max_tokens !== undefined
          ? options.max_tokens
          : ollamaConfig.defaultMaxTokens;

      const maxContinuations = options.maxContinuations ?? 8;
      let fullResponse = '';
      let context = options.context;
      let currentPrompt = prompt;

      for (let attempt = 0; attempt <= maxContinuations; attempt++) {
        const response = await axios.post(
          `${this.baseURL}/api/generate`,
          {
            model: modelName,
            prompt: currentPrompt,
            stream: false,
            context,
            options: {
              temperature: options.temperature ?? 0.7,
              top_p: options.top_p ?? 0.9,
              top_k: options.top_k ?? 40,
              num_predict: maxTokens,
              num_ctx: options.num_ctx ?? ollamaConfig.numCtx,
            },
          },
          {
            timeout: options.timeout || this.timeout,
          }
        );

        const data = response.data;
        if (!data || typeof data.response !== 'string') {
          throw new Error('Invalid response from Ollama');
        }

        fullResponse += data.response;
        context = data.context;

        const hitLengthLimit = data.done_reason === 'length';
        if (!hitLengthLimit || attempt === maxContinuations) {
          return fullResponse.trim();
        }

        currentPrompt =
          options.continuationPrompt ||
          'Continue writing from exactly where you stopped. Do not repeat any text already written. Finish the article with a complete conclusion.\n\n';
      }

      return fullResponse.trim();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama first.');
      }

      if (error.response) {
        throw new Error(`Ollama API error: ${error.response.data?.error || error.message}`);
      }

      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Multi-turn chat via Ollama /api/chat (preserves conversation roles).
   */
  async generateChat(messages, model = null, options = {}) {
    try {
      const modelName = model || this.defaultModel;
      const maxTokens =
        options.max_tokens !== undefined
          ? options.max_tokens
          : ollamaConfig.defaultMaxTokens;

      const maxContinuations = options.maxContinuations ?? 4;
      let fullResponse = '';
      let chatMessages = [...messages];

      for (let attempt = 0; attempt <= maxContinuations; attempt++) {
        const response = await axios.post(
          `${this.baseURL}/api/chat`,
          {
            model: modelName,
            messages: chatMessages,
            stream: false,
            options: {
              temperature: options.temperature ?? 0.7,
              top_p: options.top_p ?? 0.9,
              top_k: options.top_k ?? 40,
              num_predict: maxTokens,
              num_ctx: options.num_ctx ?? ollamaConfig.numCtx,
            },
          },
          {
            timeout: options.timeout || this.timeout,
          }
        );

        const data = response.data;
        const chunk = data.message?.content;
        if (typeof chunk !== 'string') {
          throw new Error('Invalid response from Ollama');
        }

        fullResponse += chunk;

        if (data.done_reason !== 'length' || attempt === maxContinuations) {
          return fullResponse.trim();
        }

        chatMessages = [
          ...chatMessages,
          { role: 'assistant', content: chunk },
          {
            role: 'user',
            content:
              'Continue from exactly where you left off. Do not repeat earlier content.',
          },
        ];
      }

      return fullResponse.trim();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama first.');
      }

      if (error.response) {
        throw new Error(`Ollama API error: ${error.response.data?.error || error.message}`);
      }

      throw new Error(`Failed to generate chat: ${error.message}`);
    }
  }

  /**
   * Generate text with streaming (for real-time responses)
   */
  async generateTextStream(prompt, model = null, onChunk = null) {
    try {
      const modelName = model || this.defaultModel;
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: modelName,
          prompt: prompt,
          stream: true,
          options: {
            num_predict: ollamaConfig.defaultMaxTokens,
            num_ctx: ollamaConfig.numCtx,
          },
        },
        {
          timeout: this.timeout,
          responseType: 'stream',
        }
      );

      return new Promise((resolve, reject) => {
        let fullResponse = '';

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter((line) => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullResponse += parsed.response;
                if (onChunk) {
                  onChunk(parsed.response);
                }
              }
              if (parsed.done) {
                resolve(fullResponse.trim());
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        });

        response.data.on('end', () => {
          resolve(fullResponse.trim());
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama first.');
      }
      throw new Error(`Failed to generate text stream: ${error.message}`);
    }
  }

  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 10000,
      });
      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }
}

module.exports = new OllamaService();
