import { ClipboardItem, ClipboardType, SortOption, SortDirection } from '../../types';
import { INITIAL_CLIPBOARD_DATA } from '../../util/Constants';

// Simulating a Room Database DAO/Repository pattern
class ClipboardRepository {
  private items: ClipboardItem[] = [...INITIAL_CLIPBOARD_DATA];

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
          // This check happens BEFORE sort direction is applied to ensure they never flip to the bottom
          // regardless of ASC or DESC. Pinned is a "State", not just a value.
          if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
          }

          // 2. Determine comparison value based on criteria
          let comparison = 0;
          
          switch (sortOption) {
            case 'CUSTOM':
              // For CUSTOM (Manual/Insertion Order), Index 0 represents the "Top" or "Newest".
              // We want DESC (Default) to show Top (Index 0) first.
              // Standard sort: if return < 0, a comes first.
              // Final logic is: sortDirection === 'ASC' ? comparison : -comparison;
              
              // If we use: indexOf(b) - indexOf(a)
              // Example: a=Index0, b=Index1. 1 - 0 = 1.
              // If ASC: returns 1. b before a. Order: 1, 0 (Bottom/Oldest first).
              // If DESC: returns -1. a before b. Order: 0, 1 (Top/Newest first).
              comparison = this.items.indexOf(b) - this.items.indexOf(a);
              break;
            
            case 'DATE':
               const dateA = new Date(a.timestamp).getTime();
               const dateB = new Date(b.timestamp).getTime();
               if (!isNaN(dateA) && !isNaN(dateB)) {
                   comparison = dateA - dateB;
               } else {
                   // Fallback for mock data strings or ID based sorting
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
      setTimeout(() => resolve(this.items.filter(i => i.isDeleted)), 100);
    });
  }

  async getFavoriteItems(): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.items.filter(i => !i.isDeleted && i.isFavorite)), 100);
    });
  }

  async getItemsByTag(tag: string): Promise<ClipboardItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.items.filter(i => !i.isDeleted && i.tags.includes(tag))), 100);
    });
  }

  async getUniqueTags(): Promise<string[]> {
    return new Promise((resolve) => {
      const tags = new Set<string>();
      this.items.filter(i => !i.isDeleted).forEach(item => item.tags.forEach(t => tags.add(t)));
      resolve(Array.from(tags).sort());
    });
  }

  async addItem(item: ClipboardItem): Promise<void> {
    this.items = [item, ...this.items];
  }

  async updateItem(id: string, updates: Partial<ClipboardItem>): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, ...updates } : i
    );
  }

  async deleteItem(id: string): Promise<void> {
    // Soft delete
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: true } : i
    );
  }

  async softDeleteItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: true } : i
    );
  }

  async unfavoriteItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isFavorite: false } : i
    );
  }

  async favoriteItems(ids: string[]): Promise<void> {
      this.items = this.items.map(i => 
        ids.includes(i.id) ? { ...i, isFavorite: true } : i
      );
  }

  async restoreItem(id: string): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isDeleted: false } : i
    );
  }

  async restoreItems(ids: string[]): Promise<void> {
    this.items = this.items.map(i => 
      ids.includes(i.id) ? { ...i, isDeleted: false } : i
    );
  }

  async deleteForever(id: string): Promise<void> {
    this.items = this.items.filter(i => i.id !== id);
  }

  async deleteItemsForever(ids: string[]): Promise<void> {
    this.items = this.items.filter(i => !ids.includes(i.id));
  }

  async pinItem(id: string, isPinned: boolean): Promise<void> {
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
        const item = { ...this.items[index], isPinned };
        // Remove from current position
        this.items.splice(index, 1);
        // Move to the very top of the list (Index 0).
        this.items.unshift(item);
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    );
  }

  async reorderItem(draggedId: string, targetId: string): Promise<void> {
    const draggedIndex = this.items.findIndex(i => i.id === draggedId);
    const targetIndex = this.items.findIndex(i => i.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...this.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    this.items = newItems;
  }

  async mergeItems(ids: string[]): Promise<void> {
    const itemsToMerge = this.items.filter(i => ids.includes(i.id));
    if (itemsToMerge.length < 2) return;

    itemsToMerge.sort((a, b) => this.items.indexOf(a) - this.items.indexOf(b));

    const mergedContent = itemsToMerge.map(i => i.content).join('\n\n');
    // Default merged category to the category of the first item
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

    this.items = [newItem, ...this.items];
  }

  async addTagsToItems(ids: string[], newTags: string[]): Promise<void> {
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        const updatedTags = Array.from(new Set([...i.tags, ...newTags]));
        return { ...i, tags: updatedTags };
      }
      return i;
    });
  }

  async replaceTagsForItems(ids: string[], newTags: string[]): Promise<void> {
    this.items = this.items.map(i => {
      if (ids.includes(i.id)) {
        return { ...i, tags: newTags };
      }
      return i;
    });
  }

  async removeTags(tagsToRemove: string[]): Promise<void> {
      this.items = this.items.map(item => ({
        ...item,
        tags: item.tags.filter(t => !tagsToRemove.includes(t))
      }));
  }

  async mergeTags(tagsToMerge: string[], newTagName: string): Promise<void> {
      this.items = this.items.map(item => {
          const hasTagToMerge = item.tags.some(t => tagsToMerge.includes(t));
          if (hasTagToMerge) {
              const filteredTags = item.tags.filter(t => !tagsToMerge.includes(t));
              const updatedTags = Array.from(new Set([...filteredTags, newTagName]));
              return { ...item, tags: updatedTags };
          }
          return item;
      });
  }
}

export const clipboardRepository = new ClipboardRepository();