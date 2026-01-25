import { ClipboardType } from '../types';

/**
 * Smart Recognition Utilities
 * Extracted from ReadScreen for better testability
 */

export interface SmartItem {
  type: 'PHONE' | 'EMAIL' | 'LINK' | 'LOCATION' | 'DATE';
  value: string;
  label?: string;
}

/**
 * Detect smart items (phone numbers, emails, links, etc.) from text
 * @param text - The text to analyze
 * @param itemType - Optional clipboard item type for context-specific detection
 * @returns Array of detected smart items
 */
export const detectSmartItems = (text: string, itemType?: ClipboardType): SmartItem[] => {
  const items: SmartItem[] = [];

  // Phone number detection
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) phones.forEach(p => items.push({ type: 'PHONE', value: p, label: 'Call' }));

  // Email detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) emails.forEach(e => items.push({ type: 'EMAIL', value: e, label: 'Email' }));

  // URL/Link detection
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = text.match(linkRegex);
  if (links) links.forEach(l => items.push({ type: 'LINK', value: l, label: 'Open' }));

  // Location detection (based on keywords or type)
  if (itemType === ClipboardType.LOCATION || text.includes('Street') || text.includes('Avenue')) {
    items.push({ type: 'LOCATION', value: text.split('\n')[0], label: 'Map' });
  }
  
  // Fallback based on item type
  if (itemType === ClipboardType.PHONE && items.length === 0) {
    items.push({ type: 'PHONE', value: text, label: 'Call' });
  }
  if (itemType === ClipboardType.LINK && items.length === 0) {
    items.push({ type: 'LINK', value: text, label: 'Open' });
  }

  return items;
};
