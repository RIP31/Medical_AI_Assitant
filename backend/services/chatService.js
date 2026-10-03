const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

const createChatError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getStatus = async () => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) {
            return {
                statusCode: 503,
                body: { available: false, message: 'Ollama is not reachable.' }
            };
        }

        const data = await response.json();
        return {
            available: true,
            model: DEFAULT_MODEL,
            models: Array.isArray(data.models) ? data.models.map((item) => item.name) : []
        };
    } catch (error) {
        return {
            statusCode: 503,
            body: {
                available: false,
                message: 'Ollama is not reachable.',
                error: error.message
            }
        };
    }
};

const generateResponse = async ({ messages, model }) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw createChatError('Messages are required.', 400);
    }

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || DEFAULT_MODEL,
                messages,
                stream: false
            })
        });

        const rawText = await response.text();
        let data = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch (parseError) {
            data = null;
        }

        if (!response.ok || !data?.message?.content) {
            const error = createChatError(
                data?.error || data?.message || 'Ollama response failed.',
                response.status || 502
            );
            error.raw = data || rawText || null;
            throw error;
        }

        return {
            text: data.message.content,
            done: Boolean(data.done),
            model: data.model || model || DEFAULT_MODEL
        };
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw createChatError('Unable to reach Ollama.', 503);
    }
};

module.exports = {
    getStatus,
    generateResponse
};
