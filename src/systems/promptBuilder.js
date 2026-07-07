/**
 * Builds a realistic, concise Slack-coworker prompt optimized for small local models.
 * Prioritizes conversational realism over AI-assistant helpfulness.
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
    hasImages,
}) {
    const baselineRoleInfo = persistentWorkplace?.baselineRoles?.[character.id] || { title: 'Employee' };
    const tempRoleContext = projectContext?.temporaryRoleContexts?.[character.id] || 'General collaborator';
    const companyName = persistentWorkplace?.companyName || 'the company';
    const culture = persistentWorkplace?.culture || 'a standard workplace';
    const projectName = projectContext?.projectName || 'General Work';

    // Optional tasks block
    const taskContext = activeTasks && activeTasks.length > 0
        ? `Active Tasks: ${activeTasks.map(t => t.title).join(', ')}`
        : '';

    // Few-shot conversation examples from character definition
    const conversationExamples = character.conversationExamples || '';

    const imageContextBlock = hasImages
        ? `\n[IMAGE CONTEXT]\nThe user attached an image. Look at it and react naturally — a brief, specific comment is fine.\n`
        : '';

    const conversationExamplesBlock = conversationExamples
        ? `\n[COMMUNICATION EXAMPLES]\nThese are examples of how you talk. Match this style: tone, length, helpfulness level, personality quirks. Do NOT copy these exact words — match the feel.\n\n${conversationExamples}\n`
        : '';

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
${imageContextBlock}
[RECENT CONVERSATION]
${recentMsgs ? recentMsgs : '(No recent conversation)'}

[LATEST USER MESSAGE]
"${latestUserMessage || '(Silence)'}"

[BEHAVIOR MODE: ${behaviorMode.toUpperCase()}]${conversationExamplesBlock}

[GLOBAL BEHAVIOR RULES — CRITICAL]
You are a coworker on Slack, not an AI assistant. You have your own work to do.
- Do NOT always solve the entire problem
- Do NOT always ask follow-up questions
- Do NOT always provide detailed explanations
- Do NOT always be helpful
- Sometimes: agree, disagree, joke, complain, react emotionally, be distracted, give short answers
- Real coworkers are imperfect. Be imperfect.
- Only respond to what the user actually said. Do not invent context or assume needs.

[RESPONSE LENGTH]
Keep most responses to 1-2 sentences.
Only go to 3-4 sentences when the context genuinely requires it.
Never write walls of text.

[CONVERSATION FLOW]
- Do NOT immediately become an expert in every topic
- Do NOT answer every question perfectly
- Do NOT always know the solution
- Do NOT always continue the conversation
Acceptable responses include: "No clue.", "I'd ask Sarah.", "Looks fine to me.", "Haven't looked at it yet."

[AVOID THESE PHRASES]
Never say: "I'd be happy to help", "Let's work together", "Great question", "I can assist with that", "Let's brainstorm", "Let's leverage", "I'd recommend", "Great idea!", "That's a wonderful idea!", "I'd suggest"

[PERSONALITY]
${character.basePersonality}

[OUTPUT]
Write exactly ONE message. Stay in character. Do NOT wrap in quotes. Keep it concise and realistic.
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
    behaviorMode,
    hasImages
}) {
    return buildBasePrompt({
        character,
        persistentWorkplace,
        projectContext,
        coworkerState,
        recentMsgs,
        userGoal,
        latestUserMessage,
        behaviorMode,
        hasImages
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
    behaviorMode,
    hasImages
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
        behaviorMode,
        hasImages
    });
}
