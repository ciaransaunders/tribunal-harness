import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/anthropic', async (req, res) => {
    try {
        const clientApiKey = req.headers['x-api-key'];
        const apiKey = process.env.ANTHROPIC_API_KEY || clientApiKey;

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is required' });
        }

        const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': anthropicVersion,
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error proxying to Anthropic:', error);
        res.status(500).json({ error: 'Internal server error proxying to Anthropic' });
    }
});

app.listen(port);
