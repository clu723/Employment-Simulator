import { generateJSON } from './aiClient';

const VERIFICATION_PROMPT = `You are evaluating a screenshot submitted as proof of task completion in a workplace simulator.

Task: "{{TASK_TITLE}}"
Task Category: {{TASK_CATEGORY}}

Evaluate the image based on:
1. **Relevance** — Does the image appear related to the task?
2. **Plausibility** — Could the image reasonably show progress or completion of this task?
3. **Apparent completion** — Does the image suggest meaningful work was done?

Guidelines:
- Be lenient — the goal is to encourage honesty, not strict verification
- Approve if the image seems remotely connected and not obviously fake
- Reject only if the image is clearly unrelated (blank, random, obviously not showing the task)
- A generic desktop or browser screenshot is acceptable if the task could reasonably be done on a computer

Return JSON:
{
  "approved": boolean,
  "confidence": number (0.0-1.0),
  "reason": string (brief explanation)
}`;

export async function approveScreenshot(task, base64Image) {
    const prompt = VERIFICATION_PROMPT
        .replace('{{TASK_TITLE}}', task.title)
        .replace('{{TASK_CATEGORY}}', task.category || 'general');

    const result = await generateJSON(prompt, {
        systemPrompt: 'You are a helpful evaluator. Return valid JSON only.',
        images: [base64Image],
    });

    return {
        approved: result.approved === true,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        reason: result.reason || 'No reason provided.',
    };
}