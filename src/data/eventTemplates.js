/**
 * Workplace event templates.
 * Events are triggered by the eventSystem based on timing, probability, or user actions.
 */

export const SCHEDULED_EVENTS = [
    {
        id: 'morning_standup',
        name: 'Morning Check-in',
        trigger: 'scheduled',
        delayAfterShiftStart: 10_000, // 10s after clock-in
        channel: 'general',
        participants: ['manager_davis', 'all'],
        promptContext: 'Start a brief morning check-in. Ask the team what they are working on today. Be brisk.',
        repeats: false,
    },
    {
        id: 'manager_checkin',
        name: 'Manager Check-in',
        trigger: 'scheduled',
        delayAfterShiftStart: 5 * 60_000, // 5 min
        channel: 'dm_manager_davis',
        participants: ['manager_davis'],
        promptContext: 'Check in on the employee\'s progress. Ask about specific tasks. Be professional but add slight pressure.',
        repeats: false,
    },
    {
        id: 'mid_shift_standup',
        name: 'Mid-Shift Update',
        trigger: 'scheduled',
        delayAfterShiftStart: 15 * 60_000, // 15 min
        channel: 'general',
        participants: ['manager_davis'],
        promptContext: 'Ask the team for a mid-shift progress update. Mention upcoming deadlines.',
        repeats: false,
    },
];

export const RANDOM_EVENTS = [
    {
        id: 'coworker_help',
        name: 'Coworker Asks For Help',
        probability: 0.9,
        channel: 'team-chat',
        participantPool: ['sarah_chen', 'mike_johnson'],
        promptContext: 'Ask the team chat for help or input with your part of the work. Be natural and in-character.',
    },
    {
        id: 'office_gossip',
        name: 'Office Gossip',
        probability: 0.2,
        channel: 'team-chat',
        participantPool: ['mike_johnson', 'jordan_the_intern'],
        promptContext: 'Share some funny or mildly dramatic office gossip. Maybe about a rumor, a meeting, or something the manager said. Keep it lighthearted.',
    },
    {
        id: 'intern_question',
        name: 'Intern Asks Question',
        probability: 0.2,
        channel: 'team-chat',
        participantPool: ['jordan_the_intern'],
        promptContext: 'Ask the team a question about work. It can be a genuine question, a slightly obvious one, or something endearingly naive.',
    },
    {
        id: 'kevin_announcement',
        name: 'Strategy Update',
        probability: 0.3,
        channel: 'general',
        participantPool: ['kevin_park'],
        promptContext: 'Share a brief strategy or planning update with the team. Keep it casual and concise.',
    },
    {
        id: 'sarah_vent',
        name: 'Sarah Vents',
        probability: 0.2,
        channel: 'team-chat',
        participantPool: ['sarah_chen'],
        promptContext: 'Vent about something mildly frustrating at work — poor quality work from someone else, a missed deadline, or a meeting that could have been an email. Be sarcastic but not mean.',
    },
    {
        id: 'company_announcement',
        name: 'Company Announcement',
        probability: 0.05,
        channel: 'announcements',
        participantPool: ['manager_davis'],
        promptContext: 'Make an official company announcement. Could be about a new policy, team achievement, upcoming event, or a slightly dystopian corporate initiative. Keep it brief and professional.',
    },
];
