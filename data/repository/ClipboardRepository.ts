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
          let comparison = 0;
          
          switch (sortOption) {
            case 'CUSTOM':
              // Pinned first, then by internal list order
              return this.items.indexOf(a) - this.items.indexOf(b);
            
            case 'DATE':
               comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
               break;
            
            case 'LENGTH':
               comparison = a.content.length - b.content.length;
               break;
            
            case 'ALPHABETICAL':
               comparison = a.content.localeCompare(b.content);
               break;
          }

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
      setTimeout(() => resolve(this.items.filter(i => !i.isDeleted && i.isPinned)), 100);
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
      ids.includes(i.id) ? { ...i, isPinned: false } : i
    );
  }

  async favoriteItems(ids: string[]): Promise<void> {
      this.items = this.items.map(i => 
        ids.includes(i.id) ? { ...i, isPinned: true } : i
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
    this.items = this.items.map(i => 
      i.id === id ? { ...i, isPinned } : i
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
    
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: mergedContent,
      type: ClipboardType.TEXT,
      timestamp: new Date().toLocaleString(),
      tags: ['#merged'],
      isPinned: false, 
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