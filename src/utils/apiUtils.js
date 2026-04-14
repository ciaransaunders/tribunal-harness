import { ANTHROPIC_API_URL } from "../constants/api";

export const callAnthropicAPI = async ({ apiKey, system, messages, max_tokens = 2000, model = 'claude-sonnet-4-20250514' }) => {
    const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens,
            system,
            messages,
        }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return data.content.map(b => b.text || '').join('');
};

export const parseJSONResponse = (raw) => {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        throw new Error("Failed to parse JSON");
    }
};
