// Utility to generate a consistent color for a given string (e.g., symptom type)
export function getColorForString(str) {
    // Simple hash function to get a number from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate color
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
}
