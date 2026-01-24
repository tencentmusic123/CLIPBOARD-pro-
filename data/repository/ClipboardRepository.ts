import { ClipboardItem, ClipboardType, SortOption, SortDirection } from '../../types';
import { INITIAL_CLIPBOARD_DATA } from '../../util/Constants';

const STORAGE_KEY = 'clipboard_max_data';
const TAGS_KEY = 'clipboard_max_tags';

// Simulating a Room Database DAO/Repository pattern with LocalStorage persistence
class ClipboardRepository {
  private items: ClipboardItem[] = [];
  private knownTags: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      const storedTags = localStorage.getItem(TAGS_KEY);

      if (storedItems) {
        this.items = JSON.parse(storedItems);
      } else {
        this.items = [...INITIAL_CLIPBOARD_DATA];
      }

      if (storedTags) {
        this.knownTags = new Set(JSON.parse(storedTags));
      } else {
        // Rebuild tags from items if not found
        this.items.forEach(item => item.tags.forEach(t => this.knownTags.add(t)));
      }
    } catch (e) {
      console.error("Failed to load data", e);
      this.items = [...INITIAL_CLIPBOARD_DATA];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      localStorage.setItem(TAGS_KEY, JSON.stringify(Array.from(this.knownTags)));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }

  async getAllItems(
    sortOption: SortOption = 'CUSTOM', 
    sortDirection: SortDirection = 'DESC'
  ): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = this.items.filter(i => !i.isDeleted);

        // Sorting Logic
        result.sort((a, b) => {
          // 1. Always prioritize Pinned items to the top
          if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
          }

          // 2. Determine comparison value based on criteria
          let comparison = 0;
          
          switch (sortOption) {
            case 'CUSTOM':
              comparison = this.items.indexOf(b) - this.items.indexOf(a); // Index based
              break;
            
            case 'DATE':
               const dateA = new Date(a.timestamp).getTime();
               const dateB = new Date(b.timestamp).getTime();
               if (!isNaN(dateA) && !isNaN(dateB)) {
                   comparison = dateA - dateB;
               } else {
                   comparison = a.id.localeCompare(b.id);
               }
               break;
            
            case 'LENGTH':
               comparison = a.content.length - b.content.length;
               break;
            
            case 'ALPHABETICAL':
               comparison = (a.title || a.content).toLowerCase().localeCompare((b.title || b.content).toLowerCase());
               break;
          }

          // 3. Apply Direction (ASC/DESC)
          return sortDirection === 'ASC' ? comparison : -comparison;
        });

        resolve(result);
      }, 50); // Reduced latency for UI responsiveness
    });
  }

  async getTrashItems(): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.items.filter(i => i.isDeleted)), 50);
    });
  }

  async getFavoriteItems(): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.items.filter(i => !i.isDeleted && i.isFavorite)), 50);
    });
  }

  async getItemsByTag(tag: string): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.items.filter(i => !i.isDeleted && i.tags.includes(tag))), 50);
    });
  }

  async getUniqueTags(): Promise<string[]> {
    return new Promise((resolve) => {
      // Return persistent tags + any tags currently on items (union), including deleted items
      const allTags = new Set(this.knownTags);
      this.items.forEach(item => item.tags.forEach(t => allTags.add(t)));
      resolve(Array.from(allTags).sort());
    });
  }

  async addNewTag(tag: string): Promise<void> {
    this.knownTags.add(tag);
    this.saveToStorage();
  }

  async addItem(item: ClipboardItem): Promise<void> {
    this.items = [item, ...this.items];
    item.tags.forEach(t => this.knownTags.add(t));
    this.saveToStorage();
  }

  async updateItem(id: string, updates: Partial<ClipboardItem>): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, ...updates } : i
    );
    if (updates.tags) {
        updates.tags.forEach(t => this.knownTags.add(t));
    }
    this.saveToStorage();
  }

  async deleteItem(id: string): Promise<void> {
    // Soft delete
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: true } : i
    );
    this.saveToStorage();
  }

  async softDeleteItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: true } : i
    );
    this.saveToStorage();
  }

  async unfavoriteItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isFavorite: false } : i
    );
    this.saveToStorage();
  }

  async favoriteItems(ids: string[]): Promise<void> {
      this.items = this.items.map(i => 
        ids.includes(i.id) ? { ...i, isFavorite: true } : i
      );
      this.saveToStorage();
  }

  async restoreItem(id: string): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: false } : i
    );
    this.saveToStorage();
  }

  async restoreItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: false } : i
    );
    this.saveToStorage();
  }

  async deleteForever(id: string): Promise<void> {
    this.items = this.items.filter(i => i.id !== id);
    this.saveToStorage();
  }

  async deleteItemsForever(ids: string[]): Promise<void> {
    this.items = this.items.filter(i => !ids.includes(i.id));
    this.saveToStorage();
  }

  async pinItem(id: string, isPinned: boolean): Promise<void> {
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
        const item = { ...this.items[index], isPinned };
        // Remove from current position
        this.items.splice(index, 1);
        // Move to the very top of the list (Index 0).
        this.items.unshift(item);
        this.saveToStorage();
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    );
    this.saveToStorage();
  }

  async reorderItem(draggedId: string, targetId: string): Promise<void> {
    const draggedIndex = this.items.findIndex(i => i.id === draggedId);
    const targetIndex = this.items.findIndex(i => i.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...this.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    this.items = newItems;
    this.saveToStorage();
  }

  async mergeItems(ids: string[]): Promise<void> {
    const itemsToMerge = this.items.filter(i => ids.includes(i.id));
    if (itemsToMerge.length < 2) return;

    // Preserve order relative to current list
    itemsToMerge.sort((a, b) => this.items.indexOf(a) - this.items.indexOf(b));

    const mergedContent = itemsToMerge.map(i => i.content).join('\n\n');
    const mergedCategory = itemsToMerge[0].category;
    
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: mergedContent,
      type: ClipboardType.TEXT,
      category: mergedCategory,
      timestamp: new Date().toLocaleString(),
      tags: ['#merged'],
      isPinned: false, 
      isFavorite: false,
      isDeleted: false
    };
    
    this.knownTags.add('#merged');
    this.items = [newItem, ...this.items];
    this.saveToStorage();
  }

  async addTagsToItems(ids: string[], newTags: string[]): Promise<void> {
    newTags.forEach(t => this.knownTags.add(t));
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        const updatedTags = Array.from(new Set([...i.tags, ...newTags]));
        return { ...i, tags: updatedTags };
      }
      return i;
    });
    this.saveToStorage();
  }

  async replaceTagsForItems(ids: string[], newTags: string[]): Promise<void> {
    newTags.forEach(t => this.knownTags.add(t));
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        return { ...i, tags: newTags };
      }
      return i;
    });
    this.saveToStorage();
  }

  async removeTags(tagsToRemove: string[]): Promise<void> {
      tagsToRemove.forEach(t => this.knownTags.delete(t));
      
      this.items = this.items.map(item => ({
        ...item,
        tags: item.tags.filter(t => !tagsToRemove.includes(t))
      }));
      this.saveToStorage();
  }

  async mergeTags(tagsToMerge: string[], newTagName: string): Promise<void> {
      this.knownTags.add(newTagName);
      tagsToMerge.forEach(t => this.knownTags.delete(t));

      this.items = this.items.map(item => {
          const hasTagToMerge = item.tags.some(t => tagsToMerge.includes(t));
          if (hasTagToMerge) {
              const filteredTags = item.tags.filter(t => !tagsToMerge.includes(t));
              const updatedTags = Array.from(new Set([...filteredTags, newTagName]));
              return { ...item, tags: updatedTags };
          }
          return item;
      });
      this.saveToStorage();
  }

  async clearAllData(): Promise<void> {
      this.items = [];
      this.knownTags = new Set();
      this.saveToStorage();
  }

  // --- Export / Import Logic ---
  
  async exportData(): Promise<string> {
    const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: this.items,
        tags: Array.from(this.knownTags)
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
      try {
          const data = JSON.parse(jsonData);
          // Basic validation
          if (!data.items || !Array.isArray(data.items)) return false;

          // Merge Tags
          if (data.tags && Array.isArray(data.tags)) {
              data.tags.forEach((t: string) => this.knownTags.add(t));
          }

          // Merge Items (Upsert based on ID)
          const existingIds = new Set(this.items.map(i => i.id));
          
          data.items.forEach((item: ClipboardItem) => {
              if (existingIds.has(item.id)) {
                  // Update existing item
                  this.items = this.items.map(i => i.id === item.id ? item : i);
              } else {
                  // Add new item (Add to top)
                  this.items.unshift(item);
              }
              // Ensure tags from item are registered
              if (item.tags) {
                  item.tags.forEach((t: string) => this.knownTags.add(t));
              }
          });
          
          this.saveToStorage();
          return true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  }
}

export { ClipboardRepository };
export const clipboardRepository = new ClipboardRepository();