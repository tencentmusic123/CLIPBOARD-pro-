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
 * @returns Array of detected smart items (deduplicated)
 */
export const detectSmartItems = (text: string, itemType?: ClipboardType): SmartItem[] => {
  const items: SmartItem[] = [];
  const seen = new Set<string>(); // Track seen values to avoid duplicates

  // Phone number detection
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) phones.forEach(p => {
    if (!seen.has(p)) {
      items.push({ type: 'PHONE', value: p, label: 'Call' });
      seen.add(p);
    }
  });

  // Email detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) emails.forEach(e => {
    if (!seen.has(e)) {
      items.push({ type: 'EMAIL', value: e, label: 'Email' });
      seen.add(e);
    }
  });

  // URL/Link detection
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = text.match(linkRegex);
  if (links) links.forEach(l => {
    if (!seen.has(l)) {
      items.push({ type: 'LINK', value: l, label: 'Open' });
      seen.add(l);
    }
  });

  // Coordinate detection (various formats)
  const coordinatePatterns = [
    // Decimal degrees with direction: 12.3039°N 76.6547°E or 12.3039°N, 76.6547°E
    /[-+]?\d+\.?\d*°?\s*[NS]\s*,?\s*[-+]?\d+\.?\d*°?\s*[EW]/gi,
    // Decimal degrees: 12.3039, 76.6547 or (12.3039, 76.6547)
    /\(?\s*[-+]?\d+\.\d+\s*,\s*[-+]?\d+\.\d+\s*\)?/g,
    // Degrees Minutes Seconds: 40°26'46"N 79°58'56"W
    /\d+°\d+'[\d."]+"?\s*[NS]\s*,?\s*\d+°\d+'[\d."]+"?\s*[EW]/gi,
  ];
  
  for (const pattern of coordinatePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(coord => {
        if (!seen.has(coord)) {
          items.push({ type: 'LOCATION', value: coord, label: 'Map' });
          seen.add(coord);
        }
      });
    }
  }

  // Location detection (based on keywords or type)
  const locationKeywords = [
    'Street', 'St', 'Avenue', 'Ave', 'Road', 'Rd', 'Boulevard', 'Blvd',
    'Lane', 'Ln', 'Drive', 'Dr', 'Court', 'Ct', 'Place', 'Pl',
    'Square', 'Sq', 'Terrace', 'Parkway', 'Highway', 'Hwy',
    'Circle', 'Way', 'Trail', 'Alley', 'Plaza', 'Junction',
    'City', 'State', 'Country', 'Zip', 'Postal', 'Address'
  ];
  
  const hasLocationKeyword = locationKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(text)
  );
  
  if ((itemType === ClipboardType.LOCATION || hasLocationKeyword) && items.filter(i => i.type === 'LOCATION').length === 0) {
    const locationValue = text.split('\n')[0];
    if (!seen.has(locationValue)) {
      items.push({ type: 'LOCATION', value: locationValue, label: 'Map' });
      seen.add(locationValue);
    }
  }
  
  // Fallback based on item type
  if (itemType === ClipboardType.PHONE && items.length === 0) {
    if (!seen.has(text)) {
      items.push({ type: 'PHONE', value: text, label: 'Call' });
      seen.add(text);
    }
  }
  if (itemType === ClipboardType.LINK && items.length === 0) {
    if (!seen.has(text)) {
      items.push({ type: 'LINK', value: text, label: 'Open' });
      seen.add(text);
    }
  }

  return items;
};

/**
 * Detect the primary clipboard type from content using smart recognition
 * @param text - The text to analyze
 * @returns The detected ClipboardType (first detected type, or TEXT as default)
 */
export const detectPrimaryType = (text: string): ClipboardType => {
  const smartItems = detectSmartItems(text);
  
  if (smartItems.length === 0) {
    return ClipboardType.TEXT;
  }

  // Map first detected smart item type to ClipboardType
  const firstDetectedType = smartItems[0].type;
  switch (firstDetectedType) {
    case 'PHONE':
      return ClipboardType.PHONE;
    case 'EMAIL':
      return ClipboardType.EMAIL;
    case 'LINK':
      return ClipboardType.LINK;
    case 'LOCATION':
      return ClipboardType.LOCATION;
    default:
      return ClipboardType.TEXT;
  }
};
