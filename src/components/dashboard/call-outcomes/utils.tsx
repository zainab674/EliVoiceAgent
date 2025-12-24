
export const normalizeResolution = (resolution: string): string => {
    if (!resolution) return 'unknown';
    const lower = resolution.toLowerCase();

    if (lower.includes('voicemail') || lower.includes('voice_mail')) return 'voicemail';
    if (lower.includes('completed') || lower.includes('answered')) return 'completed';
    if (lower.includes('missed') || lower.includes('no-answer') || lower.includes('busy') || lower.includes('failed')) return 'missed';

    return lower;
};
