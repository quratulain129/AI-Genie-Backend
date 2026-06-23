const Content = require('../models/Content');

const MAX_SESSION_HISTORY = 20;

/**
 * Load prior prompts and responses for a content session.
 */
async function getSessionHistory(sessionId) {
  if (!sessionId) return [];

  return Content.findAll({
    where: { sessionId },
    order: [['createdAt', 'ASC']],
    limit: MAX_SESSION_HISTORY,
    attributes: ['prompt', 'generatedContent', 'metadata'],
  });
}

/**
 * Format prior session exchanges for inclusion in an Ollama prompt.
 */
function formatSessionHistory(contents) {
  if (!contents.length) return '';

  const lines = contents.flatMap((entry) => {
    const meta = entry.metadata || {};
    const tag = meta.contentType || meta.marketingType || meta.mediaType || '';
    const tagPrefix = tag ? `[${tag}] ` : '';

    const assistantText =
      meta.mediaType === 'text-to-image'
        ? '[Generated an image]'
        : entry.generatedContent || '';

    return [`User: ${tagPrefix}${entry.prompt}`, `Assistant: ${assistantText}`];
  });

  return [
    'You are continuing an ongoing session. Use the prior exchanges below as context.',
    'When the user sends a follow-up, refer to earlier prompts and responses in this session.',
    '',
    '--- Session history ---',
    lines.join('\n'),
    '--- End of session history ---',
    '',
  ].join('\n');
}

/**
 * Build a prompt that includes session history plus the current instruction.
 */
function buildPromptWithSessionHistory(historyContents, currentInstruction) {
  const historyBlock = formatSessionHistory(historyContents);
  if (!historyBlock) return currentInstruction;

  return `${historyBlock}Current request:\n${currentInstruction}`;
}

module.exports = {
  getSessionHistory,
  formatSessionHistory,
  buildPromptWithSessionHistory,
};
