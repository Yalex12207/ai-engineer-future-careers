export const DURATION = 55;
export type Mode = 'interactive' | 'autoplay' | 'export';
export const scenes = [
  {
    name: 'AI Engineer', short: 'The future starts here.', start: 0, stable: 2, end: 10,
    transition: 'Typography Zoom',
    note: 'My major is Computer Science, and my future career is Artificial Intelligence Engineer. AI engineers turn ideas and data into intelligent systems that help people.',
    cue: 'Introduce the career and your major.',
  },
  {
    name: 'What they do', short: 'From data to intelligence.', start: 10, stable: 12, end: 21,
    transition: 'Geometric Morph',
    note: 'AI engineers develop intelligent systems using data, algorithms and machine learning. They prepare data, train and evaluate models, and deploy reliable software.',
    cue: 'Explain the journey from data to a useful system.',
  },
  {
    name: 'Skills & workplace', short: 'Built with skill. Together.', start: 21, stable: 23, end: 33,
    transition: 'Editorial Push',
    note: 'This career requires Python, mathematics and machine learning, as well as teamwork and problem-solving. AI engineers work in technology companies, research labs and startups, collaborating with developers and researchers.',
    cue: 'Connect technical skills with collaboration.',
  },
  {
    name: 'Real-world projects', short: 'Intelligence, in the world.', start: 33, stable: 35, end: 44,
    transition: 'Mask Wipe',
    note: 'AI assistants understand language, robots act in physical spaces, and computer vision systems interpret images. Healthcare AI can support clinicians by finding patterns in medical data.',
    cue: 'Give one concrete example from each project.',
  },
  {
    name: 'Computer Science', short: 'Your major. Your foundation.', start: 44, stable: 46.5, end: 55,
    transition: 'Match Cut',
    note: 'AI engineering is a direct application of Computer Science. Programming builds the software, algorithms guide learning, data structures organize information, and mathematics explains how models work. Together, these foundations solve real-world problems.',
    cue: 'Make the connection to Computer Science explicit.',
  },
] as const;

export function sceneAt(time: number) {
  for (let index = scenes.length - 1; index >= 0; index--) if (time >= scenes[index].start) return index;
  return 0;
}

export const career = {
  description: 'AI engineers develop intelligent systems using data, algorithms and machine learning.',
  skills: ['Python', 'Mathematics', 'Machine Learning', 'Teamwork', 'Problem-Solving'],
  workplaces: ['Technology Companies', 'Research Labs', 'Startups'],
  environment: 'Collaborative teams. Research, coding & testing. In offices, labs or remote workspaces.',
  tasks: ['Prepare & understand data', 'Train & evaluate models', 'Deploy & improve systems'],
  projects: [
    { title: 'AI Assistants', symbol: 'assistant', text: 'Understand language. Help people get things done.' },
    { title: 'Robotics', symbol: 'robot', text: 'Sense the environment. Act in the physical world.' },
    { title: 'Computer Vision', symbol: 'vision', text: 'Interpret images. Recognize objects & patterns.' },
    { title: 'Healthcare AI', symbol: 'health', text: 'Find patterns in medical data. Support clinical decisions.' },
  ],
  connection: 'AI engineering applies programming, algorithms, data structures and mathematics to solve real-world problems.',
  foundations: [
    ['Programming', 'Build the software'], ['Algorithms', 'Guide how models learn'],
    ['Data structures', 'Organize information'], ['Mathematics', 'Understand the models'],
  ],
} as const;
