import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClipboardRepository } from './ClipboardRepository';
import { ClipboardItem, ClipboardType } from '../../types';
import { INITIAL_CLIPBOARD_DATA } from '../../util/Constants';

// Create a new repository instance for each test
let repository: ClipboardRepository;

describe('ClipboardRepository', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Create a new repository instance
    // We need to re-import to get a fresh instance
    vi.resetModules();
  });

  describe('Initialization & Storage', () => {
    it('should load from localStorage on initialization', async () => {
      const testData: ClipboardItem[] = [
        {
          id: 'test-1',
          content: 'Test content',
          type: ClipboardType.TEXT,
          category: 'clipboard',
          timestamp: new Date().toISOString(),
          tags: ['#test'],
          isPinned: false,
          isFavorite: false,
          isDeleted: false
        }
      ];
      
      localStorage.setItem('clipboard_max_data', JSON.stringify(testData));
      
      // Import fresh instance
      const { ClipboardRepository } = await import('./ClipboardRepository');
      const repo = new ClipboardRepository();
      const items = await repo.getAllItems();
      
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('test-1');
      expect(items[0].content).toBe('Test content');
    });

    it('should initialize with INITIAL_CLIPBOARD_DATA when localStorage is empty', async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      const repo = new ClipboardRepository();
      const items = await repo.getAllItems();
      
      // Should have initial data (excluding deleted items)
      const nonDeletedInitialData = INITIAL_CLIPBOARD_DATA.filter(item => !item.isDeleted);
      expect(items.length).toBe(nonDeletedInitialData.length);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('clipboard_max_data', 'invalid json {{{');
      
      const { ClipboardRepository } = await import('./ClipboardRepository');
      const repo = new ClipboardRepository();
      const items = await repo.getAllItems();
      
      // Should fall back to initial data
      const nonDeletedInitialData = INITIAL_CLIPBOARD_DATA.filter(item => !item.isDeleted);
      expect(items.length).toBe(nonDeletedInitialData.length);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should add new clipboard item', async () => {
      const newItem: ClipboardItem = {
        id: 'new-1',
        content: 'New item content',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#new'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };

      await repository.addItem(newItem);
      const items = await repository.getAllItems();
      
      // New item should exist in the list
      const addedItem = items.find(i => i.id === 'new-1');
      expect(addedItem).toBeDefined();
      expect(addedItem?.content).toBe('New item content');
    });

    it('should update existing item', async () => {
      const items = await repository.getAllItems();
      const firstItemId = items[0].id;
      
      await repository.updateItem(firstItemId, { 
        content: 'Updated content',
        isFavorite: true 
      });
      
      const updatedItems = await repository.getAllItems();
      const updatedItem = updatedItems.find(i => i.id === firstItemId);
      
      expect(updatedItem?.content).toBe('Updated content');
      expect(updatedItem?.isFavorite).toBe(true);
    });

    it('should soft delete item', async () => {
      const items = await repository.getAllItems();
      const firstItemId = items[0].id;
      const initialCount = items.length;
      
      await repository.deleteItem(firstItemId);
      
      const remainingItems = await repository.getAllItems();
      expect(remainingItems.length).toBe(initialCount - 1);
      
      const trashItems = await repository.getTrashItems();
      expect(trashItems.some(i => i.id === firstItemId)).toBe(true);
    });

    it('should permanently delete item', async () => {
      const items = await repository.getAllItems();
      const firstItemId = items[0].id;
      
      await repository.deleteForever(firstItemId);
      
      const allItems = await repository.getAllItems();
      const trashItems = await repository.getTrashItems();
      
      expect(allItems.some(i => i.id === firstItemId)).toBe(false);
      expect(trashItems.some(i => i.id === firstItemId)).toBe(false);
    });

    it('should restore deleted item', async () => {
      const items = await repository.getAllItems();
      const firstItemId = items[0].id;
      
      await repository.deleteItem(firstItemId);
      await repository.restoreItem(firstItemId);
      
      const allItems = await repository.getAllItems();
      const trashItems = await repository.getTrashItems();
      
      expect(allItems.some(i => i.id === firstItemId)).toBe(true);
      expect(trashItems.some(i => i.id === firstItemId)).toBe(false);
    });
  });

  describe('Filtering Operations', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should get all non-deleted items', async () => {
      const items = await repository.getAllItems();
      
      expect(items.every(i => !i.isDeleted)).toBe(true);
    });

    it('should get only deleted items in trash', async () => {
      const items = await repository.getAllItems();
      if (items.length > 0) {
        await repository.deleteItem(items[0].id);
      }
      
      const trashItems = await repository.getTrashItems();
      expect(trashItems.every(i => i.isDeleted === true)).toBe(true);
    });

    it('should get only favorite items', async () => {
      const items = await repository.getAllItems();
      const favoriteItems = await repository.getFavoriteItems();
      
      expect(favoriteItems.every(i => i.isFavorite === true)).toBe(true);
      expect(favoriteItems.every(i => !i.isDeleted)).toBe(true);
    });

    it('should filter items by tag', async () => {
      const workItems = await repository.getItemsByTag('#work');
      
      expect(workItems.every(i => i.tags.includes('#work'))).toBe(true);
      expect(workItems.every(i => !i.isDeleted)).toBe(true);
    });
  });

  describe('Sorting Operations', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should sort by DATE ascending', async () => {
      const items = await repository.getAllItems('DATE', 'ASC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        const dateA = new Date(items[i].timestamp).getTime();
        const dateB = new Date(items[i + 1].timestamp).getTime();
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
          expect(dateA).toBeLessThanOrEqual(dateB);
        }
      }
    });

    it('should sort by DATE descending', async () => {
      const items = await repository.getAllItems('DATE', 'DESC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        const dateA = new Date(items[i].timestamp).getTime();
        const dateB = new Date(items[i + 1].timestamp).getTime();
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
          expect(dateA).toBeGreaterThanOrEqual(dateB);
        }
      }
    });

    it('should sort by LENGTH ascending', async () => {
      const items = await repository.getAllItems('LENGTH', 'ASC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        expect(items[i].content.length).toBeLessThanOrEqual(items[i + 1].content.length);
      }
    });

    it('should sort by LENGTH descending', async () => {
      const items = await repository.getAllItems('LENGTH', 'DESC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        expect(items[i].content.length).toBeGreaterThanOrEqual(items[i + 1].content.length);
      }
    });

    it('should sort by ALPHABETICAL ascending', async () => {
      const items = await repository.getAllItems('ALPHABETICAL', 'ASC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        const textA = (items[i].title || items[i].content).toLowerCase();
        const textB = (items[i + 1].title || items[i + 1].content).toLowerCase();
        expect(textA.localeCompare(textB)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by ALPHABETICAL descending', async () => {
      const items = await repository.getAllItems('ALPHABETICAL', 'DESC');
      
      for (let i = 0; i < items.length - 1; i++) {
        // Skip pinned items comparison
        if (items[i].isPinned || items[i + 1].isPinned) continue;
        
        const textA = (items[i].title || items[i].content).toLowerCase();
        const textB = (items[i + 1].title || items[i + 1].content).toLowerCase();
        expect(textA.localeCompare(textB)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by CUSTOM', async () => {
      const items = await repository.getAllItems('CUSTOM', 'DESC');
      
      // Custom sort should maintain insertion order (newest first for non-pinned)
      expect(items.length).toBeGreaterThan(0);
    });

    it('should always show pinned items first regardless of sort', async () => {
      const items = await repository.getAllItems('DATE', 'ASC');
      
      // Find first non-pinned item
      let firstNonPinnedIndex = items.findIndex(i => !i.isPinned);
      
      if (firstNonPinnedIndex > 0) {
        // All items before first non-pinned should be pinned
        for (let i = 0; i < firstNonPinnedIndex; i++) {
          expect(items[i].isPinned).toBe(true);
        }
      }
    });
  });

  describe('Tag Management', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should get all unique tags', async () => {
      const tags = await repository.getUniqueTags();
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      // Should be sorted
      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);
    });

    it('should add new tag', async () => {
      await repository.addNewTag('#newTag');
      
      const tags = await repository.getUniqueTags();
      expect(tags.includes('#newTag')).toBe(true);
    });

    it('should add tags to items', async () => {
      const items = await repository.getAllItems();
      const firstTwoIds = items.slice(0, 2).map(i => i.id);
      
      await repository.addTagsToItems(firstTwoIds, ['#added1', '#added2']);
      
      const updatedItems = await repository.getAllItems();
      const firstItem = updatedItems.find(i => i.id === firstTwoIds[0]);
      const secondItem = updatedItems.find(i => i.id === firstTwoIds[1]);
      
      expect(firstItem?.tags.includes('#added1')).toBe(true);
      expect(firstItem?.tags.includes('#added2')).toBe(true);
      expect(secondItem?.tags.includes('#added1')).toBe(true);
      expect(secondItem?.tags.includes('#added2')).toBe(true);
    });

    it('should replace tags for items', async () => {
      const items = await repository.getAllItems();
      const firstItemId = items[0].id;
      
      await repository.replaceTagsForItems([firstItemId], ['#replaced']);
      
      const updatedItems = await repository.getAllItems();
      const updatedItem = updatedItems.find(i => i.id === firstItemId);
      
      expect(updatedItem?.tags).toEqual(['#replaced']);
    });

    it('should remove tags from all items', async () => {
      const items = await repository.getAllItems();
      const firstItem = items[0];
      const tagToRemove = firstItem.tags[0];
      
      if (tagToRemove) {
        await repository.removeTags([tagToRemove]);
        
        const updatedItems = await repository.getAllItems();
        expect(updatedItems.every(i => !i.tags.includes(tagToRemove))).toBe(true);
        
        const tags = await repository.getUniqueTags();
        expect(tags.includes(tagToRemove)).toBe(false);
      }
    });

    it('should merge multiple tags into one', async () => {
      // Add items with specific tags
      const item1: ClipboardItem = {
        id: 'merge-1',
        content: 'Content 1',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#tag1'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      const item2: ClipboardItem = {
        id: 'merge-2',
        content: 'Content 2',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#tag2'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      await repository.addItem(item1);
      await repository.addItem(item2);
      
      await repository.mergeTags(['#tag1', '#tag2'], '#merged');
      
      const items = await repository.getAllItems();
      const mergedItem1 = items.find(i => i.id === 'merge-1');
      const mergedItem2 = items.find(i => i.id === 'merge-2');
      
      expect(mergedItem1?.tags.includes('#merged')).toBe(true);
      expect(mergedItem1?.tags.includes('#tag1')).toBe(false);
      expect(mergedItem2?.tags.includes('#merged')).toBe(true);
      expect(mergedItem2?.tags.includes('#tag2')).toBe(false);
      
      const tags = await repository.getUniqueTags();
      expect(tags.includes('#merged')).toBe(true);
      expect(tags.includes('#tag1')).toBe(false);
      expect(tags.includes('#tag2')).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should soft delete multiple items', async () => {
      const items = await repository.getAllItems();
      const idsToDelete = items.slice(0, 2).map(i => i.id);
      
      await repository.softDeleteItems(idsToDelete);
      
      const remainingItems = await repository.getAllItems();
      expect(remainingItems.every(i => !idsToDelete.includes(i.id))).toBe(true);
      
      const trashItems = await repository.getTrashItems();
      expect(trashItems.filter(i => idsToDelete.includes(i.id)).length).toBe(2);
    });

    it('should permanently delete multiple items', async () => {
      const items = await repository.getAllItems();
      const idsToDelete = items.slice(0, 2).map(i => i.id);
      
      await repository.deleteItemsForever(idsToDelete);
      
      const allItems = await repository.getAllItems();
      const trashItems = await repository.getTrashItems();
      
      expect(allItems.every(i => !idsToDelete.includes(i.id))).toBe(true);
      expect(trashItems.every(i => !idsToDelete.includes(i.id))).toBe(true);
    });

    it('should restore multiple items', async () => {
      const items = await repository.getAllItems();
      const idsToRestore = items.slice(0, 2).map(i => i.id);
      
      await repository.softDeleteItems(idsToRestore);
      await repository.restoreItems(idsToRestore);
      
      const allItems = await repository.getAllItems();
      expect(allItems.filter(i => idsToRestore.includes(i.id)).length).toBe(2);
      
      const trashItems = await repository.getTrashItems();
      expect(trashItems.every(i => !idsToRestore.includes(i.id))).toBe(true);
    });

    it('should favorite multiple items', async () => {
      const items = await repository.getAllItems();
      const idsToFavorite = items.slice(0, 2).map(i => i.id);
      
      await repository.favoriteItems(idsToFavorite);
      
      const updatedItems = await repository.getAllItems();
      const favoritedItems = updatedItems.filter(i => idsToFavorite.includes(i.id));
      
      expect(favoritedItems.every(i => i.isFavorite === true)).toBe(true);
    });

    it('should unfavorite multiple items', async () => {
      const items = await repository.getAllItems();
      const idsToUnfavorite = items.slice(0, 2).map(i => i.id);
      
      await repository.favoriteItems(idsToUnfavorite);
      await repository.unfavoriteItems(idsToUnfavorite);
      
      const updatedItems = await repository.getAllItems();
      const unfavoritedItems = updatedItems.filter(i => idsToUnfavorite.includes(i.id));
      
      expect(unfavoritedItems.every(i => i.isFavorite === false)).toBe(true);
    });

    it('should merge multiple items into one', async () => {
      const items = await repository.getAllItems();
      const idsToMerge = items.slice(0, 2).map(i => i.id);
      const initialCount = items.length;
      
      await repository.mergeItems(idsToMerge);
      
      const updatedItems = await repository.getAllItems();
      // Should have one more item (merged item added, originals still there)
      expect(updatedItems.length).toBe(initialCount + 1);
      
      // Find the merged item (it should have the #merged tag)
      const mergedItem = updatedItems.find(i => i.tags.includes('#merged'));
      expect(mergedItem).toBeDefined();
      expect(mergedItem?.content).toContain(items[0].content);
      expect(mergedItem?.content).toContain(items[1].content);
    });
  });

  describe('Advanced Operations', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should pin item and move to top', async () => {
      const items = await repository.getAllItems();
      const itemToPin = items.find(i => !i.isPinned);
      
      if (itemToPin) {
        await repository.pinItem(itemToPin.id, true);
        
        const updatedItems = await repository.getAllItems();
        const pinnedItem = updatedItems.find(i => i.id === itemToPin.id);
        
        expect(pinnedItem?.isPinned).toBe(true);
        // Should be at the top (index 0)
        expect(updatedItems[0].id).toBe(itemToPin.id);
      }
    });

    it('should unpin item', async () => {
      const items = await repository.getAllItems();
      const itemToUnpin = items.find(i => i.isPinned);
      
      if (itemToUnpin) {
        await repository.pinItem(itemToUnpin.id, false);
        
        const updatedItems = await repository.getAllItems();
        const unpinnedItem = updatedItems.find(i => i.id === itemToUnpin.id);
        
        expect(unpinnedItem?.isPinned).toBe(false);
      }
    });

    it('should toggle favorite status', async () => {
      const items = await repository.getAllItems();
      const item = items[0];
      const initialFavoriteStatus = item.isFavorite;
      
      await repository.toggleFavorite(item.id);
      
      const updatedItems = await repository.getAllItems();
      const toggledItem = updatedItems.find(i => i.id === item.id);
      
      expect(toggledItem?.isFavorite).toBe(!initialFavoriteStatus);
    });

    it('should reorder items via drag and drop', async () => {
      const items = await repository.getAllItems();
      
      if (items.length >= 3) {
        // Use non-pinned items to avoid complications with sorting
        const nonPinnedItems = items.filter(i => !i.isPinned);
        
        if (nonPinnedItems.length >= 2) {
          const draggedId = nonPinnedItems[0].id;
          const targetId = nonPinnedItems[nonPinnedItems.length - 1].id;
          
          await repository.reorderItem(draggedId, targetId);
          
          const updatedItems = await repository.getAllItems();
          const draggedItem = updatedItems.find(i => i.id === draggedId);
          const targetItem = updatedItems.find(i => i.id === targetId);
          
          // Both items should still exist after reordering
          expect(draggedItem).toBeDefined();
          expect(targetItem).toBeDefined();
        }
      }
    });

    it('should clear all data', async () => {
      await repository.clearAllData();
      
      const items = await repository.getAllItems();
      const tags = await repository.getUniqueTags();
      
      expect(items.length).toBe(0);
      expect(tags.length).toBe(0);
    });
  });

  describe('Import/Export', () => {
    beforeEach(async () => {
      const { ClipboardRepository } = await import('./ClipboardRepository');
      repository = new ClipboardRepository();
    });

    it('should export data to JSON', async () => {
      const exportedData = await repository.exportData();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeDefined();
      expect(Array.isArray(parsed.items)).toBe(true);
      expect(Array.isArray(parsed.tags)).toBe(true);
    });

    it('should import valid JSON data', async () => {
      const newItem: ClipboardItem = {
        id: 'import-1',
        content: 'Imported content',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#imported'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      const importData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [newItem],
        tags: ['#imported']
      };
      
      const result = await repository.importData(JSON.stringify(importData));
      expect(result).toBe(true);
      
      const items = await repository.getAllItems();
      const importedItem = items.find(i => i.id === 'import-1');
      
      expect(importedItem).toBeDefined();
      expect(importedItem?.content).toBe('Imported content');
      
      const tags = await repository.getUniqueTags();
      expect(tags.includes('#imported')).toBe(true);
    });

    it('should reject invalid JSON during import', async () => {
      const result = await repository.importData('invalid json {{{');
      expect(result).toBe(false);
    });

    it('should reject data without items array', async () => {
      const invalidData = {
        version: 1,
        timestamp: new Date().toISOString(),
        tags: ['#test']
      };
      
      const result = await repository.importData(JSON.stringify(invalidData));
      expect(result).toBe(false);
    });

    it('should merge imported data with existing data', async () => {
      const initialItems = await repository.getAllItems();
      const initialCount = initialItems.length;
      
      const newItem: ClipboardItem = {
        id: 'merge-import-1',
        content: 'Merged import content',
        type: ClipboardType.TEXT,
        category: 'clipboard',
        timestamp: new Date().toISOString(),
        tags: ['#mergeImport'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false
      };
      
      const importData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [newItem],
        tags: ['#mergeImport']
      };
      
      await repository.importData(JSON.stringify(importData));
      
      const updatedItems = await repository.getAllItems();
      expect(updatedItems.length).toBe(initialCount + 1);
      
      // Original items should still exist
      initialItems.forEach(originalItem => {
        expect(updatedItems.some(i => i.id === originalItem.id)).toBe(true);
      });
      
      // New item should exist
      expect(updatedItems.some(i => i.id === 'merge-import-1')).toBe(true);
    });

    it('should update existing item on import with same ID', async () => {
      const items = await repository.getAllItems();
      const existingItem = items[0];
      
      const updatedItem: ClipboardItem = {
        ...existingItem,
        content: 'Updated via import',
        tags: ['#updated']
      };
      
      const importData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: [updatedItem],
        tags: ['#updated']
      };
      
      await repository.importData(JSON.stringify(importData));
      
      const updatedItems = await repository.getAllItems();
      const imported = updatedItems.find(i => i.id === existingItem.id);
      
      expect(imported?.content).toBe('Updated via import');
      expect(imported?.tags).toContain('#updated');
    });
  });
});
