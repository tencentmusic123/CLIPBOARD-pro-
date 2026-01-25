import { describe, it, expect } from 'vitest';
import { detectSmartItems, SmartItem } from './SmartRecognition';
import { ClipboardType } from '../types';

describe('SmartRecognition', () => {
  
  describe('Phone Number Detection', () => {
    it('should detect simple phone numbers', () => {
      const text = 'Call me at 5551234567';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBeGreaterThan(0);
      expect(phoneItems[0].label).toBe('Call');
    });

    it('should detect phone numbers with dashes', () => {
      const text = 'Phone: 555-123-4567';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBeGreaterThan(0);
    });

    it('should detect phone numbers with parentheses', () => {
      const text = 'Contact: (555) 123-4567';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBeGreaterThan(0);
    });

    it('should detect international phone numbers', () => {
      const text = '+1 555-123-4567';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBeGreaterThan(0);
    });

    it('should detect phone numbers with dots', () => {
      const text = '555.123.4567';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBeGreaterThan(0);
    });

    it('should detect multiple phone numbers', () => {
      const text = 'Call 555-123-4567 or 555-987-6543';
      const items = detectSmartItems(text);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBe(2);
    });
  });

  describe('Email Detection', () => {
    it('should detect simple email addresses', () => {
      const text = 'Contact: user@example.com';
      const items = detectSmartItems(text);
      
      const emailItems = items.filter(i => i.type === 'EMAIL');
      expect(emailItems.length).toBe(1);
      expect(emailItems[0].value).toBe('user@example.com');
      expect(emailItems[0].label).toBe('Email');
    });

    it('should detect emails with dots and underscores', () => {
      const text = 'Email: first.last_name@company.co.uk';
      const items = detectSmartItems(text);
      
      const emailItems = items.filter(i => i.type === 'EMAIL');
      expect(emailItems.length).toBe(1);
    });

    it('should detect emails with numbers', () => {
      const text = 'user123@test456.com';
      const items = detectSmartItems(text);
      
      const emailItems = items.filter(i => i.type === 'EMAIL');
      expect(emailItems.length).toBe(1);
    });

    it('should detect multiple email addresses', () => {
      const text = 'Send to user1@example.com and user2@example.org';
      const items = detectSmartItems(text);
      
      const emailItems = items.filter(i => i.type === 'EMAIL');
      expect(emailItems.length).toBe(2);
    });
  });

  describe('URL Detection', () => {
    it('should detect HTTP URLs', () => {
      const text = 'Visit http://example.com';
      const items = detectSmartItems(text);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(1);
      expect(linkItems[0].value).toBe('http://example.com');
      expect(linkItems[0].label).toBe('Open');
    });

    it('should detect HTTPS URLs', () => {
      const text = 'Go to https://secure.example.com';
      const items = detectSmartItems(text);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(1);
    });

    it('should detect URLs with paths', () => {
      const text = 'https://example.com/path/to/page';
      const items = detectSmartItems(text);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(1);
    });

    it('should detect URLs with query parameters', () => {
      const text = 'https://example.com?param=value&other=123';
      const items = detectSmartItems(text);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(1);
    });

    it('should detect multiple URLs', () => {
      const text = 'Visit https://site1.com and https://site2.com';
      const items = detectSmartItems(text);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(2);
    });
  });

  describe('Location Detection', () => {
    it('should detect locations with "Street" keyword', () => {
      const text = '123 Main Street, New York';
      const items = detectSmartItems(text);
      
      const locationItems = items.filter(i => i.type === 'LOCATION');
      expect(locationItems.length).toBe(1);
      expect(locationItems[0].label).toBe('Map');
    });

    it('should detect locations with "Avenue" keyword', () => {
      const text = '456 Park Avenue, Suite 100';
      const items = detectSmartItems(text);
      
      const locationItems = items.filter(i => i.type === 'LOCATION');
      expect(locationItems.length).toBe(1);
    });

    it('should detect locations when type is LOCATION', () => {
      const text = '33rd Street, Fifth Avenue, New York City';
      const items = detectSmartItems(text, ClipboardType.LOCATION);
      
      const locationItems = items.filter(i => i.type === 'LOCATION');
      expect(locationItems.length).toBeGreaterThan(0);
    });

    it('should use first line for location value', () => {
      const text = '123 Main Street\nNew York, NY 10001\nUSA';
      const items = detectSmartItems(text);
      
      const locationItems = items.filter(i => i.type === 'LOCATION');
      if (locationItems.length > 0) {
        expect(locationItems[0].value).toBe('123 Main Street');
      }
    });
  });

  describe('Type-based Fallback Detection', () => {
    it('should detect phone when type is PHONE and no pattern matches', () => {
      const text = 'abc123';
      const items = detectSmartItems(text, ClipboardType.PHONE);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      expect(phoneItems.length).toBe(1);
      expect(phoneItems[0].value).toBe(text);
    });

    it('should detect link when type is LINK and no pattern matches', () => {
      const text = 'www.example.com';
      const items = detectSmartItems(text, ClipboardType.LINK);
      
      const linkItems = items.filter(i => i.type === 'LINK');
      expect(linkItems.length).toBe(1);
      expect(linkItems[0].value).toBe(text);
    });

    it('should not add fallback when patterns already matched', () => {
      const text = '555-123-4567';
      const items = detectSmartItems(text, ClipboardType.PHONE);
      
      const phoneItems = items.filter(i => i.type === 'PHONE');
      // Should only have one match from pattern, not duplicate from fallback
      expect(phoneItems.length).toBe(1);
    });
  });

  describe('Mixed Content Detection', () => {
    it('should detect multiple types in same text', () => {
      const text = 'Contact John at john@example.com or call 555-123-4567. Visit https://example.com for more info.';
      const items = detectSmartItems(text);
      
      expect(items.filter(i => i.type === 'EMAIL').length).toBe(1);
      expect(items.filter(i => i.type === 'PHONE').length).toBe(1);
      expect(items.filter(i => i.type === 'LINK').length).toBe(1);
    });

    it('should return empty array for text with no smart items', () => {
      const text = 'Just some regular text without any special patterns';
      const items = detectSmartItems(text);
      
      // Should only have items if no patterns match and no type specified
      expect(items.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const text = '';
      const items = detectSmartItems(text);
      
      expect(items).toEqual([]);
    });

    it('should handle text with only whitespace', () => {
      const text = '   \n\n   ';
      const items = detectSmartItems(text);
      
      expect(items.length).toBe(0);
    });

    it('should handle special characters gracefully', () => {
      const text = '!@#$%^&*()';
      const items = detectSmartItems(text);
      
      // Should not crash, just return empty or handle gracefully
      expect(Array.isArray(items)).toBe(true);
    });
  });
});
