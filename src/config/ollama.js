module.exports = {
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  defaultModel: process.env.OLLAMA_MODEL || 'llama3.2:1b',
  timeout: 60000, // 60 seconds timeout for generation
};

