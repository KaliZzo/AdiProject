const OpenAI = require('openai');
require('dotenv').config();

class GPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeTattooStyle(imageBase64, visionAnalysis) {
    try {
      console.log('Starting GPT analysis...');

      if (!imageBase64) {
        throw new Error('No image provided for GPT analysis');
      }

      const prompt = `As a tattoo expert, analyze this tattoo image and the provided technical analysis.
      
Technical Analysis from Google Vision API:
${JSON.stringify(visionAnalysis, null, 2)}

Based on the image and this analysis:
1. What is the main tattoo style? (Choose from: realistic, traditional, neo-traditional, tribal, japanese, blackwork, fine-line, watercolor, geometric, minimalist, black-and-grey)
2. What are the key visual elements that led to this conclusion?

Provide your answer in JSON format like this:
{
  "style": "style-name",
  "confidence": "high/medium/low",
  "reasoning": "brief explanation"
}`;

      console.log('Sending request to OpenAI...');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ],
          },
        ],
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

    //   console.log('GPT Response received:', response);

      const result = JSON.parse(response.choices[0].message.content);
      console.log('Parsed GPT Result:', result);
      
      return result;

    } catch (error) {
      console.error('Error in GPT analysis:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      throw new Error(`Failed to analyze tattoo style with GPT: ${error.message}`);
    }
  }
}

module.exports = new GPTService(); 