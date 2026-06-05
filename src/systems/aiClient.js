const API_BASE = 'https://ollama-server.tail23801d.ts.net/api';

/**
 * Generate a text response from the LLM.
 * @param {string} prompt - The user/system prompt
 * @param {object} options - Optional: { temperature, systemPrompt }
 * @returns {Promise<string>} The generated text
 */
export async function generateText(prompt, options = {}) {
    const messages = [];

    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${API_BASE}/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content?.trim() || '';
}

/**
 * Generate a response from the vision LLM with image input.
 * @param {string} prompt - The text prompt
 * @param {string[]} images - Array of base64-encoded image strings
 * @param {object} options - Optional: { temperature, systemPrompt }
 * @returns {Promise<string>} The generated text
 */
export async function generateVision(prompt, images = [], options = {}) {
    const messages = [];
    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt, images });

    const response = await fetch(`${API_BASE}/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`Vision request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content?.trim() || '';
}

/**
 * Generate a text response and parse it as JSON.
 * Falls back to raw text if parsing fails.
 * @param {string} prompt
 * @param {object} options - Optional: { temperature, systemPrompt, images }
 * @returns {Promise<object>}ac
 */
export async function generateJSON(prompt, options = {}) {
    let raw;
    if (options.images && options.images.length > 0) {
        raw = await generateVision(prompt, options.images, options);
    } else {
        raw = await generateText(prompt, options);
    }
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        console.warn('Failed to parse LLM JSON, raw:', raw);
        throw new Error('LLM returned invalid JSON');
    }
}
