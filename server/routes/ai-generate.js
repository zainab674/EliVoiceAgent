import express from 'express';
import OpenAI from 'openai';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Generate email content using AI
// @route   POST /api/v1/ai/generate-email
// @access  Private
router.post('/generate-email', protect, async (req, res) => {
    try {
        const { assistantName, documents, type } = req.body;

        let prompt = "";

        if (type === 'post_call') {
            const docNames = documents && documents.length > 0
                ? documents.map(d => d.name).join(', ')
                : "relevant documents";

            prompt = `
        You are an AI assistant named ${assistantName || 'Assistant'}.
        Write a professional, friendly post-call email to a client.
        The email should thank them for the call and mention that you are attaching the following documents: ${docNames}.
        
        Keep it concise and professional.
        Return ONLY the email body text. Do not include subject line or placeholders like [Your Name].
      `;
        } else {
            return res.status(400).json({ message: 'Invalid generation type' });
        }

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview", // or gpt-3.5-turbo if cost is concern
        });

        const generatedText = completion.choices[0].message.content.trim();

        res.json({ content: generatedText });

    } catch (error) {
        console.error('AI Generation error:', error);
        res.status(500).json({ message: 'Failed to generate content' });
    }
});

// @desc    Enhance text using AI
// @route   POST /api/v1/ai/enhance-text
// @access  Private
router.post('/enhance-text', protect, async (req, res) => {
    try {
        const { text, instruction } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        const prompt = `
        You are a professional email copywriter.
        Your task is to enhance the following email content to be more engaging, professional, and clear.
        
        Original Content:
        "${text}"
        
        ${instruction ? `Specific Instructions: ${instruction}` : ''}
        
        Return ONLY the enhanced content. Do not add conversational filler.
      `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
        });

        const enhancedText = completion.choices[0].message.content.trim();

        res.json({ content: enhancedText });

    } catch (error) {
        console.error('AI Enhancement error:', error);
        res.status(500).json({ message: 'Failed to enhance content' });
    }
});

export default router;
