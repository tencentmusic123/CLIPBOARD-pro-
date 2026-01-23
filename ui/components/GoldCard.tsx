import React, { useState, useRef } from 'react';
import { ClipboardItem, ClipboardType } from '../../types';
import { useSettings } from '../context/SettingsContext';

interface GoldCardProps {
  item: ClipboardItem;
  searchQuery?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onMenuClick?: (e: React.MouseEvent, item: ClipboardItem) => void;
  onLongPress?: (item: ClipboardItem) => void;
  onClick?: (item: ClipboardItem) => void;
  onUnpin?: (item: ClipboardItem) => void;
  onDragStart?: (e: React.DragEvent, item: ClipboardItem) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, item: ClipboardItem) => void;
}

const GoldCard: React.FC<GoldCardProps> = ({ 
  item, 
  searchQuery = '', 
  isSelectionMode = false,
  isSelected = false,
  isDraggable = false,
  onMenuClick,
  onLongPress,
  onClick,
  onUnpin,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const { accentColor, isDarkTheme } = useSettings();
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Logic Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null); // For Swipe
  const startCoords = useRef<{ x: number, y: number } | null>(null); // For Long Press Threshold
  const isDragging = useRef(false); // Distinction between click/longpress vs scroll/drag

  // --- Long Press & Click Logic ---
  
  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = false;
    startCoords.current = { x: clientX, y: clientY };
    
    // Start Long Press Timer
    timerRef.current = setTimeout(() => {
        if (!isDragging.current && onLongPress) {
            onLongPress(item);
            // Prevent click from firing after long press
            isDragging.current = true; 
        }
    }, 500);
  };

  const handleMove = (clientX: number, clientY: number) => {
      if (!startCoords.current) return;

      // Calculate distance moved
      const moveX = Math.abs(clientX - startCoords.current.x);
      const moveY = Math.abs(clientY - startCoords.current.y);
      
      // If moved more than 10px, cancel long press (it's a scroll or drag)
      if (moveX > 10 || moveY > 10) {
          isDragging.current = true;
          if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
          }
      }
  };

  const handleEnd = () => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setSwipeOffset(0);
    touchStartX.current = null;
    startCoords.current = null;
  };

  // --- Input Handlers ---

  const handleTouchStart = (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
      
      // Swipe Logic for Unpin
      if (touchStartX.current !== null && item.isPinned && onUnpin && !isSelectionMode) {
          const currentX = e.touches[0].clientX;
          const diff = currentX - touchStartX.current;
          if (diff > 0) {
              setSwipeOffset(Math.min(diff, 100));
          }
      }
  };

  const handleTouchEnd = () => {
      if (swipeOffset > 50 && onUnpin && item.isPinned && !isSelectionMode) {
          onUnpin(item);
      }
      handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      // Only Left Click triggers long press logic
      if (e.button === 0) {
          handleStart(e.clientX, e.clientY);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
  };

  const handleClick = (e: React.MouseEvent) => {
      // If we flagged it as dragging/long-pressed, don't trigger normal click
      if (isDragging.current) return;
      if (onClick) onClick(item);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      // Right click triggers Selection Mode (Long Press action)
      if (onLongPress) {
          // Clear any pending click timers just in case
          if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
          }
          onLongPress(item);
      }
  };

  const handleDragStartInternal = (e: React.DragEvent) => {
      // Cancel long press if native drag starts
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
      if (onDragStart) onDragStart(e, item);
  };

  // --- Icons & Render Helpers ---

  const getIcon = (type: ClipboardType) => {
    switch (type) {
      case ClipboardType.SECURE:
        return <path d="M12 2C9.243 2 7 4.243 7 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10H17V7C17 4.243 14.757 2 12 2ZM12 17C10.896 17 10 16.104 10 15C10 13.896 10.896 13 12 13C13.104 13 14 13.896 14 15C14 16.104 13.104 17 12 17ZM9 10V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10H9Z" />;
      case ClipboardType.LINK:
        return <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />;
      case ClipboardType.PHONE:
        return <path d="M20.487 17.14L16.634 20.993C15.634 21.993 14.075 22.253 12.83 21.782C8.69403 20.218 5.35303 16.924 3.75403 12.809C3.26803 11.536 3.52803 10.012 4.48703 9.053L8.34103 5.199C9.21503 4.325 10.629 4.325 11.503 5.199L12.923 6.619C13.344 7.04 13.344 7.724 12.923 8.145L11.332 9.736C12.396 11.696 13.999 13.299 15.959 14.363L17.55 12.772C17.971 12.351 18.655 12.351 19.076 12.772L20.496 14.192C21.37 15.066 21.362 16.266 20.487 17.14Z" />;
      case ClipboardType.LOCATION:
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        );
      default: return null;
    }
  };

  const renderContent = () => {
      let textToDisplay = "";
      
      // Auto-Title Logic: If the Title is empty, use the first 50 characters of the content.
      if (item.title && item.title.trim()) {
          textToDisplay = item.title;
      } else {
          const rawContent = item.displayContent || item.content;
          if (rawContent.length > 50) {
              textToDisplay = rawContent.substring(0, 50) + '...';
          } else {
              textToDisplay = rawContent;
          }
      }

      if (!searchQuery) return textToDisplay;

      const parts = textToDisplay.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={index} className="bg-zinc-600 text-white px-0.5 rounded-sm">{part}</span>
        ) : part
      );
  };

  const cardBg = isDarkTheme ? (isSelected ? 'bg-zinc-900' : 'bg-black hover:bg-zinc-900') : (isSelected ? 'bg-gray-100' : 'bg-white hover:bg-gray-50');
  const textColor = isDarkTheme ? 'text-white' : 'text-black';
  const tagColor = isDarkTheme ? 'text-gray-400' : 'text-gray-500';

  return (
    <div 
        className={`relative mb-6 transition-all duration-300 ease-in-out active:scale-[0.99] select-none touch-pan-y ${isDraggable ? 'cursor-move' : 'cursor-pointer'} ${isSelectionMode ? 'mr-12' : ''}`}
        draggable={isDraggable && !isSelectionMode}
        onDragStart={handleDragStartInternal}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop && onDrop(e, item)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      {/* Pinned Mark - Outside Top Left - Visible always if pinned */}
      {item.isPinned && (
          <div className="absolute -top-3 -left-1 z-20 transform -rotate-45">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="white"/>
              </svg>
          </div>
      )}

      {/* Checkmark - Outside Right - Only when IN selection mode AND Selected */}
      {isSelectionMode && isSelected && (
          <div className="absolute -right-9 top-1/2 -translate-y-1/2 z-20">
              <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
          </div>
      )}

      <div 
        className={`border rounded-3xl p-4 relative group transition-colors ${cardBg} min-h-[100px] flex flex-col`}
        style={{ borderColor: accentColor }}
      >
        <div className="relative flex-1">
            {/* 
                TEXT CONTAINER 
                - border-none for "invisible border"
                - pr-12 to ensure it doesn't touch icons on the right (approx 48px clearance)
                - pb-2 to ensure it doesn't touch tags at the bottom
            */}
            <div className="border-none w-full pr-12 pb-2">
                <p className={`font-mono text-sm leading-relaxed whitespace-normal break-words line-clamp-2 text-ellipsis overflow-hidden ${textColor}`}>
                    {renderContent()}
                </p>
            </div>
            
            {/* ICONS CONTAINER - Absolute positioned top right */}
            <div className="absolute top-0 right-0 flex flex-col items-end space-y-2 pointer-events-none">
                {/* Heart Icon */}
                {item.isFavorite && (
                    <div className="text-red-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </div>
                )}

                {/* Type Icon */}
                {item.type !== ClipboardType.TEXT && (
                    <div style={{ color: accentColor }}>
                        <svg className="w-6 h-6" fill={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? 0 : 2}>
                            {getIcon(item.type)}
                        </svg>
                    </div>
                )}
            </div>
        </div>
        
        {/* Bottom Section - Hashtags and Date aligned */}
        <div className="flex justify-between items-center mt-2 pt-1 border-t border-transparent">
            <div className="flex items-center text-xs flex-wrap gap-2">
                {item.tags.map((tag) => (
                    <span key={tag} className={`${tagColor}`}>{tag}</span>
                ))}
            </div>
            <span className={`text-[10px] ${tagColor} whitespace-nowrap ml-2`}>{item.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default GoldCard;