/**
 * Service to interact with local Ollama instance
 * Default endpoint: http://localhost:11434/api/chat
 */

const OLLAMA_API_URL = 'http://localhost:11434/api/chat';

export const checkOllamaStatus = async () => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        return response.ok;
    } catch (error) {
        console.error('Ollama connection check failed:', error);
        return false;
    }
};

export const generateOllamaResponse = async (messages, model = 'llama3.1:8b', signal) => {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal,
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false // For simplicity, we turn off streaming for now
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            text: data.message.content,
            done: true
        };
    } catch (error) {
        console.error('Error generating Ollama response:', error);
        throw error;
    }
};
