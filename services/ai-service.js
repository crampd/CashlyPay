/**
 * Placeholder AI assistant that interprets natural language invoice prompts.
 * Replace this logic with a call to an AI provider (OpenAI, AWS Bedrock, etc.)
 * when you are ready to enable production-grade experiences.
 */
function interpretPrompt(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt text is required.');
  }

  const match =
    /invoice\s+(?<customer>[a-z\s]+)\s+for\s+(?<hours>[\d.]+)\s+(?:hours?|hrs)\s+of\s+(?<work>.+)\s+at\s+\$?(?<rate>[\d.]+)/i.exec(
      prompt
    );

  if (!match?.groups) {
    return {
      title: 'Invoice Draft',
      description: prompt,
      lineItems: [
        {
          name: 'Service Fee',
          quantity: 1,
          unitAmount: 0,
          note: `Generated from prompt: "${prompt}"`,
        },
      ],
    };
  }

  const { customer, hours, work, rate } = match.groups;
  const quantity = Number.parseFloat(hours);
  const unitAmount = Math.round(Number.parseFloat(rate) * 100);

  return {
    title: `Invoice for ${capitalize(work.trim())}`,
    description: `Generated from prompt: "${prompt}"`,
    detectedCustomerName: capitalize(customer.trim()),
    lineItems: [
      {
        name: capitalize(work.trim()),
        quantity,
        unitAmount,
        note: `Derived from prompt: "${prompt}"`,
      },
    ],
  };
}

function capitalize(value) {
  if (!value) return value;
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  interpretPrompt,
};
