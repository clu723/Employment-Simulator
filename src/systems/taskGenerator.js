import { generateText } from './aiClient';

const TASK_GENERATION_PROMPT = `You are a manager generating tasks for an employee in a workplace simulator.

Current project/goal: "{{USER_GOAL}}"
Completed tasks: {{COMPLETED_TASKS}}
Currently active tasks (AVOID duplicates of these): {{ACTIVE_TASKS}}

Generate {{COUNT}} specific, realistic, computer-based task(s) the employee can complete right now. Each task must be doable in a browser or desktop app (writing, coding, researching, designing, organizing).

CRITICAL RULES:
- Do NOT generate tasks identical or very similar to the active tasks listed above
- Do NOT generate tasks that require physical presence, phone calls, or real-world resources
- Tasks should progress the user toward their current project/goal
- Keep titles concise (under 80 characters)

Return ONLY a JSON array of objects. No markdown, no other text:
[
  { "title": "Task description here", "difficulty": 3, "category": "general" }
]

Difficulty: 1 (trivial) to 5 (very hard).`;

const FALLBACK_TASKS = [
    { title: 'Review recent work for quality', difficulty: 2, category: 'general' },
    { title: 'Organize project files and notes', difficulty: 2, category: 'general' },
    { title: 'Research best practices for current task', difficulty: 3, category: 'research' },
    { title: 'Draft a progress update', difficulty: 1, category: 'writing' },
    { title: 'Refine and polish completed work', difficulty: 3, category: 'general' },
];

const MANAGER_MESSAGES = [
    "Good work closing that out. I've added another task to keep us moving forward.",
    "Nice progress. Let's tackle this next.",
    "Solid effort. Here's your next assignment — keep the momentum going.",
    "One down. I've lined up the next piece for you.",
    "Appreciate the hustle. Here's what's next.",
];

export async function generateTasks(count, context = {}) {
    const {
        userGoal = '',
        completedTasks = [],
        activeTasks = [],
        projectContext = null,
    } = context;

    const prompt = TASK_GENERATION_PROMPT
        .replace('{{USER_GOAL}}', userGoal || 'General work')
        .replace('{{COMPLETED_TASKS}}', completedTasks.length > 0 ? completedTasks.join('; ') : 'None yet')
        .replace('{{ACTIVE_TASKS}}', activeTasks.length > 0 ? activeTasks.join('; ') : 'None')
        .replace('{{COUNT}}', String(count));

    try {
        const response = await generateText(prompt, {
            systemPrompt: 'You are a helpful JSON generator. Return valid JSON only.',
        });

        const cleaned = response.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const tasks = JSON.parse(cleaned);

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return getFallbackTasks(count);
        }

        return tasks.slice(0, count).map(t => ({
            title: t.title || 'Complete task',
            difficulty: Math.min(5, Math.max(1, t.difficulty || 2)),
            category: t.category || 'general',
        }));
    } catch (err) {
        console.error('Task generation failed:', err);
        return getFallbackTasks(count);
    }
}

function getFallbackTasks(count) {
    const shuffled = [...FALLBACK_TASKS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export function getRandomManagerMessage() {
    return MANAGER_MESSAGES[Math.floor(Math.random() * MANAGER_MESSAGES.length)];
}