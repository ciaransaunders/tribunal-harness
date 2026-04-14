import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth', (req, res) => {
    const { apiKey } = req.body;
    if (apiKey) {
        res.cookie('api_key', apiKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({ success: true });
    } else {
        res.clearCookie('api_key');
        res.json({ success: true, message: 'Cookie cleared' });
    }
});

app.get('/api/auth', (req, res) => {
    res.json({ hasKey: !!req.cookies.api_key });
});

app.post('/api/anthropic', async (req, res) => {
    try {
        const headerKey = req.headers['x-api-key'];
        const clientApiKey = (headerKey && headerKey !== '***') ? headerKey : req.cookies.api_key;
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

app.listen(port, () => {
    console.log(`Backend proxy server listening at http://localhost:${port}`);
});
