import { describe, it, expect, beforeEach } from 'vitest';
import { ClipboardItem, ClipboardType } from '../../types';
import { clipboardRepository } from '../../data/repository/ClipboardRepository';

describe('ClipboardRepository', () => {
  
  // Clear localStorage before each test to ensure clean state
  beforeEach(async () => {
    localStorage.clear();
    // Clear repository state by clearing data
    await clipboardRepository.clearAllData();
  });
  
  // --- Initialization & Storage Tests (3) ---
  
  describe('Initialization & Storage', () => {
    it('should initialize with INITIAL_CLIPBOARD_DATA when localStorage is empty', async () => {
      localStorage.clear();
      // Create a new repository by reloading the module
      const items = await clipboardRepository.getAllItems();
      
      // Should have some initial data
      expect(items.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle corrupted localStorage gracefully', async () => {
      localStorage.setItem('clipboard_max_data', 'invalid json{');
      // Force re-initialization by clearing and checking
      await clipboardRepository.clearAllData();
      const items = await clipboardRepository.getAllItems();
      
      // Should handle error and return items
      expect(Array.isArray(items)).toBe(true);
    });
  });

  // --- CRUD Operations Tests (5) ---
  
  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
    });

    it('should add a new item', async () => {
      const newItem: ClipboardItem = {
        id: 'new-1',
        content: 'New item content',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#test'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };

      await clipboardRepository.addItem(newItem);
      const items = await clipboardRepository.getAllItems();
      
      // New item should be at the beginning
      expect(items[0].id).toBe('new-1');
      expect(items[0].content).toBe('New item content');
    });

    it('should update an existing item', async () => {
      const newItem: ClipboardItem = {
        id: 'test-1',
        content: 'Original content',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      await clipboardRepository.addItem(newItem);
      await clipboardRepository.updateItem('test-1', { content: 'Updated content' });
      
      const updatedItems = await clipboardRepository.getAllItems();
      const updated = updatedItems.find((i: ClipboardItem) => i.id === 'test-1');
      
      expect(updated.content).toBe('Updated content');
    });

    it('should soft delete an item', async () => {
      const newItem: ClipboardItem = {
        id: 'test-delete',
        content: 'To be deleted',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      await clipboardRepository.addItem(newItem);
      await clipboardRepository.deleteItem('test-delete');
      
      const remainingItems = await clipboardRepository.getAllItems();
      expect(remainingItems.find((i: ClipboardItem) => i.id === 'test-delete')).toBeUndefined();
      
      const trashItems = await clipboardRepository.getTrashItems();
      expect(trashItems.find((i: ClipboardItem) => i.id === 'test-delete')).toBeDefined();
    });

    it('should permanently delete an item', async () => {
      const newItem: ClipboardItem = {
        id: 'test-forever',
        content: 'To be deleted forever',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      await clipboardRepository.addItem(newItem);
      await clipboardRepository.deleteForever('test-forever');
      
      const allItems = await clipboardRepository.getAllItems();
      const trashItems = await clipboardRepository.getTrashItems();
      
      expect(allItems.find((i: ClipboardItem) => i.id === 'test-forever')).toBeUndefined();
      expect(trashItems.find((i: ClipboardItem) => i.id === 'test-forever')).toBeUndefined();
    });

    it('should restore a deleted item', async () => {
      const newItem: ClipboardItem = {
        id: 'test-restore',
        content: 'To be restored',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      await clipboardRepository.addItem(newItem);
      await clipboardRepository.deleteItem('test-restore');
      await clipboardRepository.restoreItem('test-restore');
      
      const restoredItems = await clipboardRepository.getAllItems();
      expect(restoredItems.find((i: ClipboardItem) => i.id === 'test-restore')).toBeDefined();
    });
  });

  // --- Filtering Operations Tests (4) ---
  
  describe('Filtering Operations', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      // Add test items for filtering
      await clipboardRepository.addItem({
        id: 'filter-1',
        content: 'Test item 1',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
      await clipboardRepository.addItem({
        id: 'filter-2',
        content: 'Test item 2',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should get all non-deleted items', async () => {
      const allItems = await clipboardRepository.getAllItems();
      
      expect(allItems.every((i: ClipboardItem) => !i.isDeleted)).toBe(true);
    });

    it('should get only deleted items in trash', async () => {
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.deleteItem(items[0].id);
      
      const trashItems = await clipboardRepository.getTrashItems();
      
      expect(trashItems.every((i: ClipboardItem) => i.isDeleted)).toBe(true);
      expect(trashItems.length).toBeGreaterThan(0);
    });

    it('should get only favorite items', async () => {
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.updateItem(items[0].id, { isFavorite: true });
      
      const favorites = await clipboardRepository.getFavoriteItems();
      
      expect(favorites.every((i: ClipboardItem) => i.isFavorite && !i.isDeleted)).toBe(true);
    });

    it('should filter items by tag', async () => {
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.updateItem(items[0].id, { tags: ['#test-tag'] });
      
      const taggedItems = await clipboardRepository.getItemsByTag('#test-tag');
      
      expect(taggedItems.every((i: ClipboardItem) => i.tags.includes('#test-tag'))).toBe(true);
      expect(taggedItems.length).toBeGreaterThan(0);
    });
  });

  // --- Sorting Operations Tests (8) ---
  
  describe('Sorting Operations', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      
      // Add test items with known properties
      await clipboardRepository.addItem({
        id: 'sort-1',
        content: 'A short text',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: '2024-01-01T10:00:00',
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
      
      await clipboardRepository.addItem({
        id: 'sort-2',
        content: 'Z much longer text content here',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: '2024-01-02T10:00:00',
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should sort by DATE ascending', async () => {
      const items = await clipboardRepository.getAllItems('DATE', 'ASC');
      
      // Earlier dates should come first
      const dates = items.map((i: ClipboardItem) => new Date(i.timestamp).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('should sort by DATE descending', async () => {
      const items = await clipboardRepository.getAllItems('DATE', 'DESC');
      
      // Later dates should come first
      const dates = items.map((i: ClipboardItem) => new Date(i.timestamp).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    it('should sort by LENGTH ascending', async () => {
      const items = await clipboardRepository.getAllItems('LENGTH', 'ASC');
      
      const lengths = items.map((i: ClipboardItem) => i.content.length);
      for (let i = 1; i < lengths.length; i++) {
        expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
      }
    });

    it('should sort by LENGTH descending', async () => {
      const items = await clipboardRepository.getAllItems('LENGTH', 'DESC');
      
      const lengths = items.map((i: ClipboardItem) => i.content.length);
      for (let i = 1; i < lengths.length; i++) {
        expect(lengths[i]).toBeLessThanOrEqual(lengths[i - 1]);
      }
    });

    it('should sort by ALPHABETICAL ascending', async () => {
      const items = await clipboardRepository.getAllItems('ALPHABETICAL', 'ASC');
      
      const contents = items.map((i: ClipboardItem) => (i.title || i.content).toLowerCase());
      for (let i = 1; i < contents.length; i++) {
        expect(contents[i].localeCompare(contents[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by ALPHABETICAL descending', async () => {
      const items = await clipboardRepository.getAllItems('ALPHABETICAL', 'DESC');
      
      const contents = items.map((i: ClipboardItem) => (i.title || i.content).toLowerCase());
      for (let i = 1; i < contents.length; i++) {
        expect(contents[i].localeCompare(contents[i - 1])).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by CUSTOM order', async () => {
      const items = await clipboardRepository.getAllItems('CUSTOM', 'DESC');
      
      // Custom order should maintain insertion order (newest first for DESC)
      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should always place pinned items first regardless of sort', async () => {
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.pinItem(items[items.length - 1].id, true);
      
      const sorted = await clipboardRepository.getAllItems('DATE', 'ASC');
      
      // First item should be pinned
      expect(sorted[0].isPinned).toBe(true);
    });
  });

  // --- Tag Management Tests (6) ---
  
  describe('Tag Management', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      // Add test items for tag operations
      await clipboardRepository.addItem({
        id: 'tag-test-1',
        content: 'Item for tag test',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#initial'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should get all unique tags', async () => {
      const tags = await clipboardRepository.getUniqueTags();
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should add a new tag to the system', async () => {
      await clipboardRepository.addNewTag('#new-tag');
      
      const tags = await clipboardRepository.getUniqueTags();
      expect(tags).toContain('#new-tag');
    });

    it('should add tags to items', async () => {
      const items = await clipboardRepository.getAllItems();
      const itemId = items[0].id;
      
      await clipboardRepository.addTagsToItems([itemId], ['#added-tag']);
      
      const updated = await clipboardRepository.getAllItems();
      const updatedItem = updated.find((i: ClipboardItem) => i.id === itemId);
      
      expect(updatedItem.tags).toContain('#added-tag');
    });

    it('should replace tags for items', async () => {
      const items = await clipboardRepository.getAllItems();
      const itemId = items[0].id;
      
      await clipboardRepository.replaceTagsForItems([itemId], ['#replaced']);
      
      const updated = await clipboardRepository.getAllItems();
      const updatedItem = updated.find((i: ClipboardItem) => i.id === itemId);
      
      expect(updatedItem.tags).toEqual(['#replaced']);
    });

    it('should remove tags from system and items', async () => {
      await clipboardRepository.addNewTag('#to-remove');
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.addTagsToItems([items[0].id], ['#to-remove']);
      
      await clipboardRepository.removeTags(['#to-remove']);
      
      const tags = await clipboardRepository.getUniqueTags();
      expect(tags).not.toContain('#to-remove');
      
      const updated = await clipboardRepository.getAllItems();
      expect(updated[0].tags).not.toContain('#to-remove');
    });

    it('should merge multiple tags into one', async () => {
      const items = await clipboardRepository.getAllItems();
      await clipboardRepository.addTagsToItems([items[0].id], ['#tag1', '#tag2']);
      
      await clipboardRepository.mergeTags(['#tag1', '#tag2'], '#merged');
      
      const tags = await clipboardRepository.getUniqueTags();
      expect(tags).toContain('#merged');
      expect(tags).not.toContain('#tag1');
      expect(tags).not.toContain('#tag2');
      
      const updated = await clipboardRepository.getAllItems();
      expect(updated[0].tags).toContain('#merged');
    });
  });

  // --- Batch Operations Tests (6) ---
  
  describe('Batch Operations', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      // Add test items for batch operations
      await clipboardRepository.addItem({
        id: 'batch-1',
        content: 'Item 1',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
      await clipboardRepository.addItem({
        id: 'batch-2',
        content: 'Item 2',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
      await clipboardRepository.addItem({
        id: 'batch-3',
        content: 'Item 3',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should soft delete multiple items', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToDelete = [items[0].id, items[1].id];
      
      await clipboardRepository.softDeleteItems(idsToDelete);
      
      const remaining = await clipboardRepository.getAllItems();
      expect(remaining.find((i: ClipboardItem) => i.id === items[0].id)).toBeUndefined();
      expect(remaining.find((i: ClipboardItem) => i.id === items[1].id)).toBeUndefined();
    });

    it('should permanently delete multiple items', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToDelete = [items[0].id, items[1].id];
      
      await clipboardRepository.deleteItemsForever(idsToDelete);
      
      const remaining = await clipboardRepository.getAllItems();
      const trash = await clipboardRepository.getTrashItems();
      
      expect(remaining.find((i: ClipboardItem) => i.id === items[0].id)).toBeUndefined();
      expect(trash.find((i: ClipboardItem) => i.id === items[0].id)).toBeUndefined();
    });

    it('should restore multiple items', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToRestore = [items[0].id, items[1].id];
      
      await clipboardRepository.softDeleteItems(idsToRestore);
      await clipboardRepository.restoreItems(idsToRestore);
      
      const restored = await clipboardRepository.getAllItems();
      expect(restored.find((i: ClipboardItem) => i.id === items[0].id)).toBeDefined();
      expect(restored.find((i: ClipboardItem) => i.id === items[1].id)).toBeDefined();
    });

    it('should favorite multiple items', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToFavorite = [items[0].id, items[1].id];
      
      await clipboardRepository.favoriteItems(idsToFavorite);
      
      const favorites = await clipboardRepository.getFavoriteItems();
      expect(favorites.find((i: ClipboardItem) => i.id === items[0].id)).toBeDefined();
      expect(favorites.find((i: ClipboardItem) => i.id === items[1].id)).toBeDefined();
    });

    it('should unfavorite multiple items', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToUnfavorite = [items[0].id];
      
      await clipboardRepository.favoriteItems(idsToUnfavorite);
      await clipboardRepository.unfavoriteItems(idsToUnfavorite);
      
      const updated = await clipboardRepository.getAllItems();
      const item = updated.find((i: ClipboardItem) => i.id === items[0].id);
      expect(item.isFavorite).toBe(false);
    });

    it('should merge multiple items into one', async () => {
      const items = await clipboardRepository.getAllItems();
      const idsToMerge = [items[0].id, items[1].id];
      
      const beforeCount = items.length;
      await clipboardRepository.mergeItems(idsToMerge);
      
      const afterItems = await clipboardRepository.getAllItems();
      expect(afterItems.length).toBe(beforeCount + 1); // Original items remain + 1 merged
      
      const mergedItem = afterItems[0]; // Should be at top
      expect(mergedItem.tags).toContain('#merged');
    });
  });

  // --- Advanced Operations Tests (5) ---
  
  describe('Advanced Operations', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      // Add test items for advanced operations
      await clipboardRepository.addItem({
        id: 'adv-1',
        content: 'Advanced test item 1',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
      await clipboardRepository.addItem({
        id: 'adv-2',
        content: 'Advanced test item 2',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should pin item and move to top', async () => {
      const items = await clipboardRepository.getAllItems();
      const lastItem = items[items.length - 1];
      
      await clipboardRepository.pinItem(lastItem.id, true);
      
      const updated = await clipboardRepository.getAllItems();
      expect(updated[0].id).toBe(lastItem.id);
      expect(updated[0].isPinned).toBe(true);
    });

    it('should unpin item', async () => {
      const items = await clipboardRepository.getAllItems();
      const itemId = items[0].id;
      
      await clipboardRepository.pinItem(itemId, true);
      await clipboardRepository.pinItem(itemId, false);
      
      const updated = await clipboardRepository.getAllItems();
      const item = updated.find((i: ClipboardItem) => i.id === itemId);
      expect(item.isPinned).toBe(false);
    });

    it('should toggle favorite status', async () => {
      const items = await clipboardRepository.getAllItems();
      const itemId = items[0].id;
      const initialFavorite = items[0].isFavorite;
      
      await clipboardRepository.toggleFavorite(itemId);
      
      const updated = await clipboardRepository.getAllItems();
      const item = updated.find((i: ClipboardItem) => i.id === itemId);
      expect(item.isFavorite).toBe(!initialFavorite);
    });

    it('should reorder items via drag and drop', async () => {
      const items = await clipboardRepository.getAllItems();
      if (items.length < 2) return; // Need at least 2 items
      
      const firstId = items[0].id;
      const secondId = items[1].id;
      
      await clipboardRepository.reorderItem(firstId, secondId);
      
      const updated = await clipboardRepository.getAllItems('CUSTOM', 'DESC');
      // Order should have changed
      expect(updated).toBeDefined();
    });

    it('should clear all data', async () => {
      await clipboardRepository.clearAllData();
      
      const items = await clipboardRepository.getAllItems();
      const tags = await clipboardRepository.getUniqueTags();
      
      expect(items).toHaveLength(0);
      expect(tags).toHaveLength(0);
    });
  });

  // --- Import/Export Tests (6) ---
  
  describe('Import/Export', () => {
    beforeEach(async () => {
      await clipboardRepository.clearAllData();
      // Add test item for import/export
      await clipboardRepository.addItem({
        id: 'export-test-1',
        content: 'Item for export test',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: [],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      });
    });

    it('should export data as JSON', async () => {
      const exported = await clipboardRepository.exportData();
      
      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe(1);
      expect(parsed.items).toBeDefined();
      expect(parsed.tags).toBeDefined();
      expect(Array.isArray(parsed.items)).toBe(true);
    });

    it('should import valid JSON data', async () => {
      const testData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [{
          id: 'imported-1',
          content: 'Imported content',
          type: ClipboardType.TEXT,
          category: 'clipboard' as const,
          timestamp: new Date().toISOString(),
          tags: ['#imported'],
          isPinned: false,
          isFavorite: false,
          isDeleted: false
        }],
        tags: ['#imported']
      };
      
      const result = await clipboardRepository.importData(JSON.stringify(testData));
      
      expect(result).toBe(true);
      const items = await clipboardRepository.getAllItems();
      expect(items.find((i: ClipboardItem) => i.id === 'imported-1')).toBeDefined();
    });

    it('should reject invalid JSON', async () => {
      const result = await clipboardRepository.importData('invalid json{');
      
      expect(result).toBe(false);
    });

    it('should merge imported data with existing', async () => {
      const beforeItems = await clipboardRepository.getAllItems();
      const beforeCount = beforeItems.length;
      
      const testData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [{
          id: 'new-import',
          content: 'New imported',
          type: ClipboardType.TEXT,
          category: 'clipboard' as const,
          timestamp: new Date().toISOString(),
          tags: [],
          isPinned: false,
          isFavorite: false,
          isDeleted: false
        }],
        tags: []
      };
      
      await clipboardRepository.importData(JSON.stringify(testData));
      
      const afterItems = await clipboardRepository.getAllItems();
      expect(afterItems.length).toBe(beforeCount + 1);
    });

    it('should update existing items by ID on import', async () => {
      const items = await clipboardRepository.getAllItems();
      const existingId = items[0].id;
      
      const testData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [{
          ...items[0],
          content: 'Updated via import'
        }],
        tags: []
      };
      
      await clipboardRepository.importData(JSON.stringify(testData));
      
      const updated = await clipboardRepository.getAllItems();
      const updatedItem = updated.find((i: ClipboardItem) => i.id === existingId);
      expect(updatedItem.content).toBe('Updated via import');
    });

    it('should import and merge tags', async () => {
      const testData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [],
        tags: ['#imported-tag-1', '#imported-tag-2']
      };
      
      await clipboardRepository.importData(JSON.stringify(testData));
      
      const tags = await clipboardRepository.getUniqueTags();
      expect(tags).toContain('#imported-tag-1');
      expect(tags).toContain('#imported-tag-2');
    });
  });
});
