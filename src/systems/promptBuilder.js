/**
 * Builds a strict, structured prompt optimized for small local models (e.g. Qwen 2B).
 * Emphasizes behavioral priorities, usefulness, and isolation of the user message.
 */

function buildBasePrompt({
    character,
    persistentWorkplace,
    projectContext,
    coworkerState,
    recentMsgs,
    userGoal,
    activeTasks,
    latestUserMessage,
    behaviorMode,
}) {
    const baselineRoleInfo = persistentWorkplace?.baselineRoles?.[character.id] || { title: 'Employee' };
    const tempRoleContext = projectContext?.temporaryRoleContexts?.[character.id] || 'General collaborator';
    const companyName = persistentWorkplace?.companyName || 'the company';
    const culture = persistentWorkplace?.culture || 'a standard workplace';
    const projectName = projectContext?.projectName || 'General Work';

    // Conversational strengths list
    const strengths = character.conversationalStyle?.strengths?.join(', ') || 'collaborating';
    
    // Optional tasks block
    const taskContext = activeTasks && activeTasks.length > 0
        ? `Active Tasks: ${activeTasks.map(t => t.title).join(', ')}`
        : '';

    // Good/Bad examples block
    const goodExample = character.examples?.good || '"Here is a direct answer to your question."';
    const badExample = character.examples?.bad || '"Let\'s leverage our synergy to align on this objective!"';

    return `[IDENTITY]
You are ${character.name}, working as a ${baselineRoleInfo.title} at ${companyName}.
Workplace Culture: ${culture}

[CURRENT CONTEXT]
Active Project: "${projectName}"
Your temporary project role/context: ${tempRoleContext}
User's immediate goal: "${userGoal || 'Working on general tasks'}"
Mood: ${coworkerState?.mood || character.defaultMood}
${coworkerState?.memorySummary ? `Recent memory: ${coworkerState.memorySummary}` : ''}
${taskContext}

[RECENT CONVERSATION]
${recentMsgs ? recentMsgs : '(No recent conversation)'}

[LATEST USER MESSAGE]
"${latestUserMessage || '(Silence)'}"

[BEHAVIOR MODE: ${behaviorMode.toUpperCase()}]
Your conversational strengths are: ${strengths}. Apply them to the latest message.

[GLOBAL PRIORITIES - STRICTLY FOLLOW]
1. DIRECT RESPONSE: Answer the LATEST USER MESSAGE directly and concretely.
2. COLLABORATION: Move the work forward meaningfully (brainstorm, suggest, critique, or ask a specific follow-up).
3. SUBTLE FLAVOR: Express your personality naturally and subtly. It is seasoning, not the main dish.
4. NO FILLER: Do not use generic motivational filler or repetitive corporate buzzwords.
5. NO REPETITION: Do not repeat previous phrases or loop your speech patterns.

[PERSONALITY GUIDANCE]
${character.basePersonality}

[EXAMPLES]
GOOD RESPONSE (Concrete, helpful, subtle flavor):
${goodExample}

BAD RESPONSE (Repetitive, overly roleplay-heavy, buzzword salad):
${badExample}

[OUTPUT CONSTRAINTS]
Write exactly ONE single message.
Stay in character.
Do NOT wrap your message in quotes.
Keep it concise and realistic.
Your response:`;
}

export function buildCoworkerPrompt({
    character,
    persistentWorkplace,
    projectContext,
    coworkerState,
    recentMsgs,
    userGoal,
    latestUserMessage,
    behaviorMode
}) {
    return buildBasePrompt({
        character,
        persistentWorkplace,
        projectContext,
        coworkerState,
        recentMsgs,
        userGoal,
        latestUserMessage,
        behaviorMode
    });
}

export function buildCoworkerDMPrompt({
    character,
    persistentWorkplace,
    projectContext,
    coworkerState,
    recentMsgs,
    userGoal,
    activeTasks,
    latestUserMessage,
    behaviorMode
}) {
    return buildBasePrompt({
        character,
        persistentWorkplace,
        projectContext,
        coworkerState,
        recentMsgs,
        userGoal,
        activeTasks,
        latestUserMessage,
        behaviorMode
    });
}
