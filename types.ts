export enum ClipboardType {
  TEXT = 'TEXT',
  SECURE = 'SECURE',
  LINK = 'LINK',
  PHONE = 'PHONE',
  LOCATION = 'LOCATION'
}

export interface ClipboardItem {
  id: string;
  title?: string; // New optional title
  content: string; // Plain text content for searching and preview
  htmlContent?: string; // Rich text content for display
  displayContent?: string; // For masked content
  type: ClipboardType;
  category: 'clipboard' | 'notes'; // Strict separation
  timestamp: string; // ISO string or formatted time string for this demo
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isDeleted?: boolean; // New flag for trash
  metadata?: {
    label?: string; // e.g. "Work", "Home"
  };
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

export type ScreenName = 'SPLASH' | 'HOME' | 'NOTES' | 'TRASH' | 'FAVORITE' | 'READ' | 'EDIT' | 'TAGS' | 'TAG_DETAILS' | 'SETTINGS';

export type SortOption = 'CUSTOM' | 'DATE' | 'LENGTH' | 'ALPHABETICAL';
export type SortDirection = 'ASC' | 'DESC';