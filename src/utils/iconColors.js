// Color configurations for icons and categories

export const iconColors = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
};

export const categoryIconColors = {
    'Medications': iconColors.violet,
    'Symptoms': iconColors.orange,
    'Measurements': iconColors.green,
    'Factors': iconColors.yellow,
    'Mood': iconColors.pink,
    'Nutrition': iconColors.cyan,
    'Activity': iconColors.blue,
    'Sleep': iconColors.slate,
    'Tasks': { bg: 'bg-teal-100', text: 'text-teal-600' },
};
