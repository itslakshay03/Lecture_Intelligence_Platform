import {
  LayoutDashboard,
  Sparkles,
  FileText,
  HelpCircle,
  Layers,
  CalendarClock,
  Briefcase,
  Library,
  Settings,
} from 'lucide-react';

/**
 * Single source of truth for shell navigation + route metadata.
 * `title` / `subtitle` also drive the Topbar heading per route.
 */
export const NAV_SECTIONS = [
  {
    heading: null,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        title: 'Dashboard',
        subtitle: 'Turn a lecture into a complete study pack',
      },
      {
        id: 'process',
        label: 'Lecture Processing',
        to: '/process',
        icon: Sparkles,
        title: 'Lecture Processing',
        subtitle: 'Track transcript, AI notes and PDF generation',
      },
      {
        id: 'library',
        label: 'Lecture Library',
        to: '/library',
        icon: Library,
        title: 'Lecture Library',
        subtitle: 'Every study pack you have generated',
      },
    ],
  },
  {
    heading: 'Study Tools',
    items: [
      {
        id: 'notes',
        label: 'Study Pack / Notes',
        to: '/notes',
        icon: FileText,
        title: 'Study Notes',
        subtitle: 'Structured, grounded lecture notes',
      },
      {
        id: 'quiz',
        label: 'Quiz',
        to: '/quiz',
        icon: HelpCircle,
        title: 'Quiz',
        subtitle: 'Check understanding with generated questions',
      },
      {
        id: 'flashcards',
        label: 'Flashcards',
        to: '/flashcards',
        icon: Layers,
        title: 'Flashcards',
        subtitle: 'Active recall over key concepts',
      },
      {
        id: 'revision',
        label: 'Revision Plan',
        to: '/revision',
        icon: CalendarClock,
        title: 'Revision Plan',
        subtitle: 'Spaced repetition schedule',
      },
      {
        id: 'interview',
        label: 'Interview Questions',
        to: '/interview',
        icon: Briefcase,
        title: 'Interview Questions',
        subtitle: 'Practice questions by difficulty',
      },
    ],
  },
  {
    heading: null,
    items: [
      {
        id: 'settings',
        label: 'Settings',
        to: '/settings',
        icon: Settings,
        title: 'Settings',
        subtitle: 'Preferences and appearance',
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export function findNavByPath(pathname) {
  return (
    ALL_NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) || null
  );
}
