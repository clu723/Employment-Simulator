import { generateJSON } from './aiClient';
import { ALL_CHARACTERS } from '../data/coworkerTemplates';

/**
 * Generates a stable, persistent workplace context based on a vibe preset.
 * @param {string} workplaceVibe The user's selected vibe (e.g., "Creative Startup", "Corporate Dystopia")
 * @returns {Promise<object>} The generated persistent context
 */
export async function generatePersistentWorkplace(workplaceVibe) {
    const coworkerList = ALL_CHARACTERS.map(c => `- ${c.id} (${c.archetype})`).join('\n');

    const prompt = `You are a simulation engine generating a persistent workplace universe. 
The user has selected the following workplace vibe: "${workplaceVibe}"

Generate a realistic, immersive company environment that fits this vibe.
Assign BROAD, GENERAL baseline job titles (e.g. "Creative Lead", "Specialist", "Operations", not specific like "React Dev") and a fitting emoji for each of the following coworkers based on their personality archetype:
${coworkerList}

Also generate 3-4 persistent slack-style channel names (starting with #) relevant to this company culture (e.g. #general, #announcements, #watercooler).

Output strictly as a JSON object with this exact structure:
{
    "companyName": "String",
    "workplaceType": "String (e.g. Indie Studio, Digital Agency)",
    "culture": "String (short description of the vibe and long-term atmosphere)",
    "baselineRoles": {
        "coworker_id": {
            "title": "Broad Job Title",
            "emoji": "🏢"
        }
    },
    "persistentChannels": [
        { "id": "channel_1_name", "name": "channel_1_name", "description": "Channel purpose" }
    ]
}

DO NOT include markdown formatting, backticks, or any text outside of the JSON object. Just the raw JSON.`;

    const systemPrompt = "You are a helpful JSON generator. Always return valid JSON only without markdown formatting.";

    try {
        const result = await generateJSON(prompt, { systemPrompt });

        // Ensure all characters have a role
        if (!result.baselineRoles) result.baselineRoles = {};
        for (const char of ALL_CHARACTERS) {
            if (!result.baselineRoles[char.id]) {
                result.baselineRoles[char.id] = { title: 'Employee', emoji: '🧑' };
            }
        }

        if (!result.persistentChannels || result.persistentChannels.length === 0) {
            result.persistentChannels = [{ id: 'general', name: 'general', description: 'Company-wide announcements' }];
        }

        result.persistentChannels = result.persistentChannels.map(ch => ({
            ...ch,
            id: ch.id.replace(/^#/, ''),
            name: ch.name.replace(/^#/, ''),
            type: 'channel'
        }));

        return result;
    } catch (err) {
        console.error("Error generating persistent workplace:", err);
        return {
            companyName: "Generic Corp",
            workplaceType: "Corporate Office",
            culture: "Standard 9-to-5",
            baselineRoles: ALL_CHARACTERS.reduce((acc, char) => ({ ...acc, [char.id]: { title: 'Colleague', emoji: '🧑‍💼' } }), {}),
            persistentChannels: [
                { id: 'general', name: 'general', type: 'channel', description: 'General chatter' }
            ]
        };
    }
}

/**
 * Generates a temporary project context based on the current goal and workplace context.
 * @param {string} userGoal The user's active goal/project (e.g., "Build React portfolio")
 * @param {object} persistentWorkplace The stable workplace context
 * @returns {Promise<object>} The generated project context
 */
export async function generateProjectContext(userGoal, persistentWorkplace) {
    const coworkerList = ALL_CHARACTERS.map(c => `- ${c.name} (Baseline role: ${persistentWorkplace.baselineRoles?.[c.id]?.title || 'Employee'})`).join('\n');

    const prompt = `You are a simulation engine generating a temporary project context within an existing company.
Company: ${persistentWorkplace.companyName} (${persistentWorkplace.workplaceType})
Culture: ${persistentWorkplace.culture}

The user has started a new project with this goal: "${userGoal}"

Generate the temporary collaboration framing for this project. 
For each coworker, define their TEMPORARY COLLABORATION ROLE or context for this specific project (e.g. "Acts as technical reviewer", "Acts as brainstorming partner", "Not heavily involved"). 

Coworkers:
${coworkerList}

Also generate 1-2 temporary project-specific channels.

Output strictly as a JSON object with this exact structure:
{
    "projectName": "String (Short name for the project)",
    "temporaryRoleContexts": {
        "coworker_id": "String (e.g. Acts as technical reviewer)"
    },
    "projectChannels": [
        { "id": "channel_name", "name": "channel_name", "description": "Channel purpose" }
    ]
}

DO NOT include markdown formatting, backticks, or any text outside of the JSON object. Just the raw JSON.`;

    const systemPrompt = "You are a helpful JSON generator. Always return valid JSON only without markdown formatting.";

    try {
        const result = await generateJSON(prompt, { systemPrompt });

        if (!result.temporaryRoleContexts) result.temporaryRoleContexts = {};
        for (const char of ALL_CHARACTERS) {
            if (!result.temporaryRoleContexts[char.id]) {
                result.temporaryRoleContexts[char.id] = "General contributor";
            }
        }

        if (!result.projectChannels) result.projectChannels = [];
        result.projectChannels = result.projectChannels.map(ch => ({
            ...ch,
            id: ch.id.replace(/^#/, ''),
            name: ch.name.replace(/^#/, ''),
            type: 'channel'
        }));

        return result;
    } catch (err) {
        console.error("Error generating project context:", err);
        return {
            projectName: userGoal,
            temporaryRoleContexts: ALL_CHARACTERS.reduce((acc, char) => ({ ...acc, [char.id]: "Collaborator" }), {}),
            projectChannels: []
        };
    }
}
