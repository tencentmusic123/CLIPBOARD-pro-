/**
 * AI Text Processing Utilities
 * Extracted from EditScreen for better testability
 */

/**
 * Remove duplicate lines from text
 */
export const removeDuplicates = (text: string): string => {
  const uniqueLines = new Set<string>();
  return text.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    if (uniqueLines.has(trimmed)) return false;
    uniqueLines.add(trimmed);
    return true;
  }).join('\n');
};

/**
 * Clean up text formatting (remove extra spaces, empty lines, etc.)
 */
export const cleanupFormat = (text: string): string => {
  return text.split('\n')
    .map(l => l.trim().replace(/\s+/g, ' '))
    .filter(l => l.length > 0)
    .join('\n');
};

/**
 * Convert text to a bulleted list
 */
export const convertToList = (text: string): string => {
  let items: string[] = [];
  if (text.includes('\n')) {
    items = text.split('\n');
  } else if (text.match(/[.!?]\s/)) {
    items = text.split(/(?<=[.!?])\s+/);
  } else if (text.includes(',')) {
    items = text.split(',');
  } else {
    items = [text];
  }
  
  return items
    .map(i => i.trim())
    .filter(i => i.length > 0)
    .map(i => {
      const clean = i.replace(/^[-*•]\s*/, '');
      return `• ${clean}`;
    })
    .join('\n');
};

/**
 * Basic grammar fixes (spacing, capitalization)
 */
export const fixGrammar = (text: string): string => {
  let newText = text.replace(/\s+/g, ' ');
  newText = newText.replace(/([.,!?])(?=[a-zA-Z])/g, '$1 ');
  newText = newText.charAt(0).toUpperCase() + newText.slice(1);
  newText = newText.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  newText = newText.replace(/\b i \b/g, ' I ');
  return newText;
};

/**
 * Change text case based on mode
 * @param text - The text to transform
 * @param mode - 0: UPPERCASE, 1: lowercase, 2: Title Case, 3: Sentence case
 */
export const changeCase = (text: string, mode: number): string => {
  switch (mode) {
    case 0: return text.toUpperCase(); // UPPERCASE
    case 1: return text.toLowerCase(); // lowercase
    case 2: return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); // Title Case
    case 3: return text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase()); // Sentence case
    default: return text;
  }
};
