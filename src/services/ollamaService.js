const axios = require('axios');
const ollamaConfig = require('../config/ollama');

class OllamaService {
  constructor() {
    this.baseURL = ollamaConfig.baseURL;
    this.defaultModel = ollamaConfig.defaultModel;
    this.timeout = ollamaConfig.timeout;
  }

  /**
   * Generate text using Ollama
   * @param {string} prompt - The prompt to send to the model
   * @param {string} model - Optional model name (defaults to configured model)
   * @param {object} options - Additional options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, model = null, options = {}) {
    try {
      const modelName = model || this.defaultModel;
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            top_k: options.top_k || 40,
            num_predict: options.max_tokens || 512,
          },
        },
        {
          timeout: this.timeout,
        }
      );

      if (response.data && response.data.response) {
        return response.data.response.trim();
      }

      throw new Error('Invalid response from Ollama');
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
   * Generate text with streaming (for real-time responses)
   * @param {string} prompt - The prompt to send to the model
   * @param {string} model - Optional model name
   * @param {function} onChunk - Callback function for each chunk
   * @returns {Promise<void>}
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

  /**
   * Check if Ollama is available
   * @returns {Promise<boolean>}
   */
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

  /**
   * List available models
   * @returns {Promise<Array>}
   */
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

