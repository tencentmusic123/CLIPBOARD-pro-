import { ClipboardItem, ClipboardType } from '../types';

export const THEME_COLORS = {
  GOLD: '#D4AF37',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  DARK_GRAY: '#1A1A1A'
};

export const INITIAL_CLIPBOARD_DATA: ClipboardItem[] = [
  {
    id: '1',
    content: 'Your paragraph tex buhuhuhuh jebuetguejjebuebgueugeutmmm',
    type: ClipboardType.TEXT,
    timestamp: '10:44 PM • 20 Dec',
    tags: ['#work'],
    isPinned: true,
    isDeleted: true, // Moved to trash as per screenshot
  },
  {
    id: '2',
    content: 'my credit card no is *******1234 with pin *****abc',
    displayContent: 'my credit card no is *******1234\nwith pin *****abc',
    type: ClipboardType.SECURE,
    timestamp: '10:43 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true, // Moved to trash as per screenshot
  },
  {
    id: '3',
    content: 'https://www.google.com',
    type: ClipboardType.LINK,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true, // Moved to trash as per screenshot
  },
  {
    id: '4',
    content: '+99 9876543210',
    type: ClipboardType.PHONE,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true, // Moved to trash as per screenshot
  },
  {
    id: '5',
    content: '33rd Street, Fifth Avenue, New York City, New York, United States',
    type: ClipboardType.LOCATION,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true, // Moved to trash as per screenshot
  },
  {
    id: '6',
    content: 'Meeting notes: Discuss Q1 roadmap and budget allocation.',
    type: ClipboardType.TEXT,
    timestamp: '09:00 AM • 24 Dec',
    tags: ['#work'],
    isPinned: false,
    isDeleted: false,
  },
  {
    id: '7',
    content: 'Buy milk, eggs, and bread on the way home.',
    type: ClipboardType.TEXT,
    timestamp: '06:30 PM • 24 Dec',
    tags: ['#personal'],
    isPinned: false,
    isDeleted: false,
  }
];