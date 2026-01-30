import { ClipboardType } from '../types';

/**
 * Smart Recognition Utilities
 */

export interface SmartItem {
  type: 'PHONE' | 'EMAIL' | 'LINK' | 'LOCATION' | 'DATE' | 'SECURE';
  value: string;
  label?: string;
}

/**
 * Detect smart items (phone numbers, emails, links, etc.) from text
 */
export const detectSmartItems = (text: string, itemType?: ClipboardType): SmartItem[] => {
  const items: SmartItem[] = [];
  const seen = new Set<string>();

  // 1. Credit Card-like patterns (13-19 digits)
  const ccRegex = /\b(?:\d[ -]*?){13,19}\b/g;
  const ccMatches = text.match(ccRegex);
  if (ccMatches) {
    ccMatches.forEach(m => {
      const clean = m.replace(/\D/g, '');
      if (clean.length >= 13 && clean.length <= 19) {
         if (!seen.has(m)) {
           items.push({ type: 'SECURE', value: m, label: 'Sensitive' });
           seen.add(m);
         }
      }
    });
  }

  // 2. Sensitive Keywords
  const keywordRegex = /\b(password|passwd|pin|secret|token|api[_\-]?key|access[_\-]?token|auth[_\-]?token|verification[_\-]?code|otp|client[_\-]?secret)\s*(:|is|=)\s*\S+/gi;
  const keywordMatches = text.match(keywordRegex);
  if (keywordMatches) {
    keywordMatches.forEach(m => {
       if (!seen.has(m)) {
         items.push({ type: 'SECURE', value: m, label: 'Sensitive' });
         seen.add(m);
       }
    });
  }

  // Phone number
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones) phones.forEach(p => {
    if (!seen.has(p)) {
      items.push({ type: 'PHONE', value: p, label: 'Call' });
      seen.add(p);
    }
  });

  // Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) emails.forEach(e => {
    if (!seen.has(e)) {
      items.push({ type: 'EMAIL', value: e, label: 'Email' });
      seen.add(e);
    }
  });

  // URL/Link
  const linkRegex = /https?:\/\/[^\s]+/g;
  const links = text.match(linkRegex);
  if (links) links.forEach(l => {
    if (!seen.has(l)) {
      items.push({ type: 'LINK', value: l, label: 'Open' });
      seen.add(l);
    }
  });

  // Coordinates
  const coordinatePatterns = [
    /[-+]?\d+\.?\d*°?\s*[NS]\s*,?\s*[-+]?\d+\.?\d*°?\s*[EW]/gi,
    /\(?\s*[-+]?\d+\.\d+\s*,\s*[-+]?\d+\.\d+\s*\)?/g,
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

  // Location Keywords
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
  
  // Fallbacks
  if (itemType === ClipboardType.PHONE && items.length === 0) {
    if (!seen.has(text)) items.push({ type: 'PHONE', value: text, label: 'Call' });
  }
  if (itemType === ClipboardType.LINK && items.length === 0) {
    if (!seen.has(text)) items.push({ type: 'LINK', value: text, label: 'Open' });
  }

  return items;
};

/**
 * Detect the primary clipboard type from content using smart recognition
 */
export const detectPrimaryType = (text: string): ClipboardType => {
  const smartItems = detectSmartItems(text);
  
  if (smartItems.length === 0) {
    return ClipboardType.TEXT;
  }

  // Priority: SECURE > PHONE/EMAIL/LINK/LOCATION
  if (smartItems.some(i => i.type === 'SECURE')) {
    return ClipboardType.SECURE;
  }

  const firstDetectedType = smartItems[0].type;
  switch (firstDetectedType) {
    case 'PHONE': return ClipboardType.PHONE;
    case 'EMAIL': return ClipboardType.EMAIL;
    case 'LINK': return ClipboardType.LINK;
    case 'LOCATION': return ClipboardType.LOCATION;
    default: return ClipboardType.TEXT;
  }
};

/**
 * Mask sensitive content (last 6 characters)
 */
export const maskContent = (text: string): string => {
  if (text.length <= 6) return '******';
  return text.slice(0, -6) + '******';
};
