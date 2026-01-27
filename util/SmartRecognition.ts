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
  const seen = new Set<string>(); // Track seen values to prevent duplicates

  // Phone number detection
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    phones.forEach(p => {
      const normalized = p.replace(/[-.\s()]/g, ''); // Normalize for duplicate detection
      if (!seen.has(normalized)) {
        items.push({ type: 'PHONE', value: p, label: 'Call' });
        seen.add(normalized);
      }
    });
  }

  // Email detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) {
    emails.forEach(e => {
      const normalized = e.toLowerCase();
      if (!seen.has(normalized)) {
        items.push({ type: 'EMAIL', value: e, label: 'Email' });
        seen.add(normalized);
      }
    });
  }

  // URL/Link detection
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = text.match(linkRegex);
  if (links) {
    links.forEach(l => {
      if (!seen.has(l)) {
        items.push({ type: 'LINK', value: l, label: 'Open' });
        seen.add(l);
      }
    });
  }

  // Location detection (based on keywords or type)
  if (itemType === ClipboardType.LOCATION || text.includes('Street') || text.includes('Avenue')) {
    const locationValue = text.split('\n')[0];
    if (!seen.has(locationValue)) {
      items.push({ type: 'LOCATION', value: locationValue, label: 'Map' });
      seen.add(locationValue);
    }
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

/**
 * Auto-detect the clipboard type from content
 * This is used to automatically assign the correct type when creating new items
 * @param text - The text content to analyze
 * @returns The detected ClipboardType
 */
export const detectClipboardType = (text: string): ClipboardType => {
  if (!text || text.trim().length === 0) {
    return ClipboardType.TEXT;
  }

  const trimmed = text.trim();

  // Check for URLs/Links (most specific, check first)
  const linkRegex = /^https?:\/\/[^\s]+$/i;
  if (linkRegex.test(trimmed)) {
    return ClipboardType.LINK;
  }

  // Check for phone numbers
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  if (phoneRegex.test(trimmed.replace(/\s/g, ''))) {
    return ClipboardType.PHONE;
  }

  // Check for location keywords
  if (trimmed.includes('Street') || trimmed.includes('Avenue') || trimmed.includes('Road') || 
      trimmed.includes('Boulevard') || trimmed.includes('Lane') || trimmed.includes('Drive')) {
    return ClipboardType.LOCATION;
  }

  // Check if content contains sensitive keywords (passwords, keys, tokens)
  const secureKeywords = ['password', 'token', 'api_key', 'secret', 'private_key', 'auth'];
  const lowerText = trimmed.toLowerCase();
  if (secureKeywords.some(keyword => lowerText.includes(keyword))) {
    return ClipboardType.SECURE;
  }

  // Default to TEXT
  return ClipboardType.TEXT;
};
