import { describe, it, expect } from 'vitest';
import {
  removeDuplicates,
  cleanupFormat,
  convertToList,
  fixGrammar,
  changeCase
} from './AITextProcessor';

describe('AITextProcessor', () => {
  
  describe('removeDuplicates', () => {
    it('should remove duplicate lines', () => {
      const input = 'line1\nline2\nline1\nline3\nline2';
      const result = removeDuplicates(input);
      
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should handle text with no duplicates', () => {
      const input = 'unique1\nunique2\nunique3';
      const result = removeDuplicates(input);
      
      expect(result).toBe(input);
    });

    it('should remove empty lines', () => {
      const input = 'line1\n\nline2\n\nline3';
      const result = removeDuplicates(input);
      
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should handle single line', () => {
      const input = 'single line';
      const result = removeDuplicates(input);
      
      expect(result).toBe('single line');
    });

    it('should trim whitespace when comparing', () => {
      const input = 'line1\n  line1  \nline2';
      const result = removeDuplicates(input);
      
      expect(result).toBe('line1\nline2');
    });
  });

  describe('cleanupFormat', () => {
    it('should remove extra spaces', () => {
      const input = 'text   with    extra     spaces';
      const result = cleanupFormat(input);
      
      expect(result).toBe('text with extra spaces');
    });

    it('should trim leading and trailing spaces', () => {
      const input = '  text with spaces  \n  another line  ';
      const result = cleanupFormat(input);
      
      expect(result).toBe('text with spaces\nanother line');
    });

    it('should remove empty lines', () => {
      const input = 'line1\n\n\nline2\n\nline3';
      const result = cleanupFormat(input);
      
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should normalize multiple whitespace types', () => {
      const input = 'text\twith\t\ttabs  and   spaces';
      const result = cleanupFormat(input);
      
      expect(result).toBe('text with tabs and spaces');
    });

    it('should handle already clean text', () => {
      const input = 'clean text\nanother line';
      const result = cleanupFormat(input);
      
      expect(result).toBe(input);
    });
  });

  describe('convertToList', () => {
    it('should convert comma-separated text to bullet list', () => {
      const input = 'item1, item2, item3';
      const result = convertToList(input);
      
      expect(result).toBe('• item1\n• item2\n• item3');
    });

    it('should convert period-separated text to bullet list', () => {
      const input = 'First sentence. Second sentence. Third sentence.';
      const result = convertToList(input);
      
      expect(result).toContain('• First sentence');
      expect(result).toContain('• Second sentence');
    });

    it('should convert newline-separated text to bullet list', () => {
      const input = 'item1\nitem2\nitem3';
      const result = convertToList(input);
      
      expect(result).toBe('• item1\n• item2\n• item3');
    });

    it('should re-format already bulleted list', () => {
      const input = '- item1\n* item2\n• item3';
      const result = convertToList(input);
      
      expect(result).toBe('• item1\n• item2\n• item3');
    });

    it('should handle single item', () => {
      const input = 'single item';
      const result = convertToList(input);
      
      expect(result).toBe('• single item');
    });

    it('should filter out empty items', () => {
      const input = 'item1\n\nitem2\n\n';
      const result = convertToList(input);
      
      expect(result).toBe('• item1\n• item2');
    });
  });

  describe('fixGrammar', () => {
    it('should add spaces after punctuation', () => {
      const input = 'hello,world.how are you?good!';
      const result = fixGrammar(input);
      
      // Grammar fix capitalizes first letter and sentences
      expect(result).toContain(',');
      expect(result).toContain('.');
      expect(result).toContain('?');
    });

    it('should capitalize first letter', () => {
      const input = 'this is a sentence';
      const result = fixGrammar(input);
      
      expect(result).toMatch(/^[A-Z]/);
    });

    it('should capitalize after sentence endings', () => {
      const input = 'first sentence. second sentence! third sentence?';
      const result = fixGrammar(input);
      
      expect(result).toContain('. S');
      expect(result).toContain('! T');
    });

    it('should normalize multiple spaces to single space', () => {
      const input = 'text   with    multiple     spaces';
      const result = fixGrammar(input);
      
      expect(result).not.toContain('  ');
    });

    it('should fix lowercase "i" to uppercase "I"', () => {
      const input = 'i think i am right';
      const result = fixGrammar(input);
      
      expect(result).toContain(' I ');
    });
  });

  describe('changeCase', () => {
    const testText = 'hello world. this is a TEST.';

    it('should convert to UPPERCASE (mode 0)', () => {
      const result = changeCase(testText, 0);
      
      expect(result).toBe('HELLO WORLD. THIS IS A TEST.');
    });

    it('should convert to lowercase (mode 1)', () => {
      const result = changeCase(testText, 1);
      
      expect(result).toBe('hello world. this is a test.');
    });

    it('should convert to Title Case (mode 2)', () => {
      const result = changeCase(testText, 2);
      
      expect(result).toBe('Hello World. This Is A Test.');
    });

    it('should convert to Sentence case (mode 3)', () => {
      const result = changeCase(testText, 3);
      
      expect(result).toContain('Hello world.');
      expect(result).toContain('This is a test.');
    });

    it('should handle mode cycling', () => {
      // Test that modes wrap around properly
      const text = 'test';
      
      expect(changeCase(text, 0)).toBe('TEST');
      expect(changeCase(text, 1)).toBe('test');
      expect(changeCase(text, 2)).toBe('Test');
      expect(changeCase(text, 3)).toMatch(/^[A-Z]/);
    });

    it('should preserve text for invalid mode', () => {
      const text = 'Test Text';
      const result = changeCase(text, 999);
      
      expect(result).toBe(text);
    });
  });
});
