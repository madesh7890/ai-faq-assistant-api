const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini client
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
    throw new Error(
      'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'
    );
  }

  return new GoogleGenAI({
    apiKey: apiKey,
  });
};

/**
 * Generate an answer for a question
 */
const generateAnswer = async (question) => {
  try {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are a helpful assistant.

Provide a clear, concise and direct answer to the following question.
Do not include introductory text.
Do not use markdown formatting.
Return only the answer.

Question: ${question}`,
    });

    if (!response || !response.text) {
      throw new Error('No response text received from Gemini API');
    }

    return response.text.trim();

  } catch (error) {
    console.error(
      'Error in geminiService.generateAnswer:',
      error
    );

    throw new Error(
      `AI Answer Generation failed: ${error.message}`
    );
  }
};

/**
 * Generate one FAQ question and answer
 */
const generateFAQ = async (topic) => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ai = getClient();

      console.log(
        `Generating FAQ... Attempt ${attempt}/${maxRetries}`
      );

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: `Generate one frequently asked question and a helpful answer about the topic: "${topic}".

Return only valid JSON in this format:
{
  "question": "A clear FAQ question",
  "answer": "A detailed and helpful answer"
}`,

        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',

            properties: {
              question: {
                type: 'STRING',
                description:
                  'A clear and common question about the topic.',
              },

              answer: {
                type: 'STRING',
                description:
                  'A detailed and helpful answer to the question.',
              },
            },

            required: ['question', 'answer'],
          },
        },
      });

      if (!response || !response.text) {
        throw new Error(
          'No response received from Gemini API'
        );
      }

      const faqPair = JSON.parse(response.text);

      return faqPair;

    } catch (error) {
      console.error(
        `FAQ generation attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );

      // Gemini temporarily unavailable
      if (error.status === 503 && attempt < maxRetries) {
        console.log(
          'Gemini is busy. Retrying in 2 seconds...'
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 2000)
        );

        continue;
      }

      throw new Error(
        `AI FAQ Generation failed: ${error.message}`
      );
    }
  }
};

/**
 * Export functions
 */
module.exports = {
  generateAnswer,
  generateFAQ,
};