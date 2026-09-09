import {
  LayoutDashboard,
  Sparkles,
  Library,
  Search,
  Settings,
  FileText,
  HelpCircle,
  Layers,
  CalendarClock,
  Briefcase,
} from 'lucide-react';

/**
 * Single source of truth for shell navigation + route metadata.
 *
 * PRIMARY_NAV — real routes, rendered as ordinary links in both the desktop
 * TopNav and the mobile drawer (Sidebar).
 *
 * STUDY_TOOL_NAV — Notes/Quiz/Flashcards/Revision/Interview do not have
 * standalone pages (they only render inside an open lecture's Study Pack).
 * These entries are shortcuts, not routes: clicking one opens the most
 * recently processed lecture's real Study Pack at that tab (via
 * openStudyTool, see features/dashboard/lib/openStudyTool.js), or sends the
 * user to /library if there is no lecture yet. No fake pages are created.
 *
 * UTILITY_NAV — Search + Profile, rendered on the right of the TopNav and
 * inside the mobile drawer.
 */
export const PRIMARY_NAV = [
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
    title: 'Process Lecture',
    subtitle: 'Paste a YouTube URL to generate a study pack',
  },
  {
    id: 'library',
    label: 'Lecture Library',
    to: '/library',
    icon: Library,
    title: 'Lecture Library',
    subtitle: 'Every study pack you have generated',
  },
];

export const STUDY_TOOL_NAV = [
  { id: 'studypack', label: 'Study Pack', icon: FileText, tab: 'overview' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, tab: 'quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, tab: 'flashcards' },
  { id: 'revision', label: 'Revision Plan', icon: CalendarClock, tab: 'revision' },
  { id: 'interview', label: 'Interview', icon: Briefcase, tab: 'interview' },
];

export const UTILITY_NAV = [
  {
    id: 'search',
    label: 'Search',
    to: '/search',
    icon: Search,
    title: 'Search',
    subtitle: 'Find a lecture in your library',
  },
  {
    id: 'settings',
    label: 'Profile',
    to: '/settings',
    icon: Settings,
    title: 'Settings',
    subtitle: 'Preferences and appearance',
  },
];

const ROUTABLE_NAV_ITEMS = [...PRIMARY_NAV, ...UTILITY_NAV];

export function findNavByPath(pathname) {
  return (
    ROUTABLE_NAV_ITEMS.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ||
    null
  );
}
