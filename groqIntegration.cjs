const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: "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" });

async function getGroqChatCompletion(userMessage) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama3-8b-8192",
  });
}

module.exports = { getGroqChatCompletion }; // Export the function
