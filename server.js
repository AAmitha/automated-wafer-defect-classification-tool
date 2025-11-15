import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/classify', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable.' });
  }

  const { imageBase64, asciiMap } = req.body || {};

  if (!imageBase64 && !asciiMap) {
    return res.status(400).json({ error: 'Provide either an imageBase64 or asciiMap payload.' });
  }

  const contents = [];

  contents.push({
    role: 'user',
    parts: [
      {
        text: 'You are a semiconductor fabrication quality control assistant. '
          + 'Given wafer map data identify the most likely defect type (Scratch, Contamination, Missing Pattern, Uniform) '
          + 'and describe the reasoning in less than 80 words.'
      }
    ]
  });

  if (imageBase64) {
    contents[0].parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
      }
    });
  }

  if (asciiMap) {
    contents[0].parts.push({
      text: `ASCII wafer map:\n${asciiMap}`
    });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      { contents },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const candidates = response.data?.candidates?.[0];
    const textPart = candidates?.content?.parts?.find((part) => part.text);

    res.json({
      result: textPart?.text || 'No response returned',
      raw: response.data
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: 'Gemini API request failed',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Wafer defect service listening on http://localhost:${PORT}`);
});
