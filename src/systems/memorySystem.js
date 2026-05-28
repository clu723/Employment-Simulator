import { generateText } from './aiClient';
import { getCharacterById } from '../data/coworkerTemplates';

/**
 * Summarizes a user's recent interactions with a specific coworker to maintain long-term memory.
 * 
 * @param {string} characterId The ID of the coworker
 * @param {Array} recentInteractions Array of message objects involving this character and the user
 * @param {string} previousSummary The existing memory summary
 * @param {object} persistentWorkplace The current workplace context
 * @returns {Promise<string>} The new updated memory summary
 */
export async function summarizeMemory(characterId, recentInteractions, previousSummary, persistentWorkplace) {
    if (!recentInteractions || recentInteractions.length === 0) {
        return previousSummary; // Nothing new to summarize
    }

    const character = getCharacterById(characterId);
    if (!character) return previousSummary;

    // Format the recent interactions into a readable script
    const interactionText = recentInteractions.map(msg => {
        return `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.senderName}: ${msg.text}`;
    }).join('\n');

    const prompt = `You are a memory summarization system for an AI coworker simulation.
The coworker is: ${character.name}.
They have an existing memory summary of the user: "${previousSummary || 'None.'}"

Here are the most recent interactions between the coworker and the user today:
<interactions>
${interactionText}
</interactions>

Your task is to rewrite the memory summary for ${character.name} to incorporate what happened today. 
Keep it concise, in the third person (e.g., "Sarah remembers that the user is good at coding but was late today...").
Focus only on relationship dynamics, significant facts learned about the user, and ongoing work context.
DO NOT exceed 4 sentences. If nothing significant happened, keep the previous summary mostly the same.

Return ONLY the updated summary text.`;

    try {
        const newSummary = await generateText(prompt);
        return newSummary.trim() || previousSummary;
    } catch (error) {
        console.error(`Failed to summarize memory for ${characterId}:`, error);
        return previousSummary;
    }
}
