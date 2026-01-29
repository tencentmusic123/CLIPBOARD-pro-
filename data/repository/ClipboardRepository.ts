import { ClipboardItem, ClipboardType, SortOption, SortDirection } from '../../types';
import { INITIAL_CLIPBOARD_DATA } from '../../util/Constants';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'clipboard_max_data';
const TAGS_KEY = 'clipboard_max_tags';

class ClipboardRepository {
  private items: ClipboardItem[] = [];
  private knownTags: Set<string> = new Set();
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const { value: storedItems } = await Preferences.get({ key: STORAGE_KEY });
      const { value: storedTags } = await Preferences.get({ key: TAGS_KEY });

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

  private async saveToStorage() {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(this.items)
      });
      await Preferences.set({
        key: TAGS_KEY,
        value: JSON.stringify(Array.from(this.knownTags))
      });
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }

  async getAllItems(
    sortOption: SortOption = 'CUSTOM', 
    sortDirection: SortDirection = 'DESC'
  ): Promise<ClipboardItem[]> {
    await this.initPromise;
    
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

    return result;
  }

  async getTrashItems(): Promise<ClipboardItem[]> {
    await this.initPromise;
    return this.items.filter(i => i.isDeleted);
  }

  async getFavoriteItems(): Promise<ClipboardItem[]> {
    await this.initPromise;
    return this.items.filter(i => !i.isDeleted && i.isFavorite);
  }

  async getItemsByTag(tag: string): Promise<ClipboardItem[]> {
    await this.initPromise;
    return this.items.filter(i => !i.isDeleted && i.tags.includes(tag));
  }

  async getUniqueTags(): Promise<string[]> {
    await this.initPromise;
    const allTags = new Set(this.knownTags);
    this.items.forEach(item => item.tags.forEach(t => allTags.add(t)));
    return Array.from(allTags).sort();
  }

  async addNewTag(tag: string): Promise<void> {
    await this.initPromise;
    this.knownTags.add(tag);
    await this.saveToStorage();
  }

  async addItem(item: ClipboardItem): Promise<void> {
    await this.initPromise;
    const duplicate = this.items.find(
      i => !i.isDeleted && 
           i.category === item.category && 
           i.content === item.content
    );
    
    if (duplicate) return;
    
    this.items = [item, ...this.items];
    item.tags.forEach(t => this.knownTags.add(t));
    await this.saveToStorage();
  }

  async updateItem(id: string, updates: Partial<ClipboardItem>): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      i.id === id ? { ...i, ...updates } : i
    );
    if (updates.tags) {
        updates.tags.forEach(t => this.knownTags.add(t));
    }
    await this.saveToStorage();
  }

  async deleteItem(id: string): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: true } : i
    );
    await this.saveToStorage();
  }

  async softDeleteItems(ids: string[]): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: true } : i
    );
    await this.saveToStorage();
  }

  async unfavoriteItems(ids: string[]): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isFavorite: false } : i
    );
    await this.saveToStorage();
  }

  async favoriteItems(ids: string[]): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isFavorite: true } : i
    );
    await this.saveToStorage();
  }

  async restoreItem(id: string): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: false } : i
    );
    await this.saveToStorage();
  }

  async restoreItems(ids: string[]): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: false } : i
    );
    await this.saveToStorage();
  }

  async deleteForever(id: string): Promise<void> {
    await this.initPromise;
    this.items = this.items.filter(i => i.id !== id);
    await this.saveToStorage();
  }

  async deleteItemsForever(ids: string[]): Promise<void> {
    await this.initPromise;
    this.items = this.items.filter(i => !ids.includes(i.id));
    await this.saveToStorage();
  }

  async pinItem(id: string, isPinned: boolean): Promise<void> {
    await this.initPromise;
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
        const item = { ...this.items[index], isPinned };
        this.items.splice(index, 1);
        this.items.unshift(item);
        await this.saveToStorage();
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.initPromise;
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    );
    await this.saveToStorage();
  }

  async reorderItem(draggedId: string, targetId: string): Promise<void> {
    await this.initPromise;
    const draggedIndex = this.items.findIndex(i => i.id === draggedId);
    const targetIndex = this.items.findIndex(i => i.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...this.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    this.items = newItems;
    await this.saveToStorage();
  }

  async mergeItems(ids: string[]): Promise<void> {
    await this.initPromise;
    const itemsToMerge = this.items.filter(i => ids.includes(i.id));
    if (itemsToMerge.length < 2) return;

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
    await this.saveToStorage();
  }

  async addTagsToItems(ids: string[], newTags: string[]): Promise<void> {
    await this.initPromise;
    newTags.forEach(t => this.knownTags.add(t));
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        const updatedTags = Array.from(new Set([...i.tags, ...newTags]));
        return { ...i, tags: updatedTags };
      }
      return i;
    });
    await this.saveToStorage();
  }

  async replaceTagsForItems(ids: string[], newTags: string[]): Promise<void> {
    await this.initPromise;
    newTags.forEach(t => this.knownTags.add(t));
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        return { ...i, tags: newTags };
      }
      return i;
    });
    await this.saveToStorage();
  }

  async removeTags(tagsToRemove: string[]): Promise<void> {
    await this.initPromise;
    tagsToRemove.forEach(t => this.knownTags.delete(t));
    
    this.items = this.items.map(item => ({
      ...item,
      tags: item.tags.filter(t => !tagsToRemove.includes(t))
    }));
    await this.saveToStorage();
  }

  async mergeTags(tagsToMerge: string[], newTagName: string): Promise<void> {
    await this.initPromise;
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
    await this.saveToStorage();
  }

  async clearAllData(): Promise<void> {
    this.items = [];
    this.knownTags = new Set();
    await this.saveToStorage();
  }

  async exportData(): Promise<string> {
    await this.initPromise;
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
        await this.initPromise;
        const data = JSON.parse(jsonData);
        if (!data.items || !Array.isArray(data.items)) return false;

        if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach((t: string) => this.knownTags.add(t));
        }

        const existingIds = new Set(this.items.map(i => i.id));
        
        data.items.forEach((item: ClipboardItem) => {
            if (existingIds.has(item.id)) {
                this.items = this.items.map(i => i.id === item.id ? item : i);
            } else {
                this.items.unshift(item);
            }
            if (item.tags) {
                item.tags.forEach((t: string) => this.knownTags.add(t));
            }
        });
        
        await this.saveToStorage();
        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
  }
}

export const clipboardRepository = new ClipboardRepository();