module.exports = {
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  defaultModel: process.env.OLLAMA_MODEL || 'llama3.2:1b',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 600000,
  defaultMaxTokens: parseInt(process.env.OLLAMA_NUM_PREDICT, 10) || -1,
  numCtx: parseInt(process.env.OLLAMA_NUM_CTX, 10) || 8192,
};

