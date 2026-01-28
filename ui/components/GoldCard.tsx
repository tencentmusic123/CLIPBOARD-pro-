import React, { useRef } from 'react';
import { ClipboardItem, ClipboardType } from '../../types';
import { useSettings } from '../context/SettingsContext';

interface GoldCardProps {
  item: ClipboardItem;
  index?: number; // Added for staggered animation
  searchQuery?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onMenuClick?: (e: React.MouseEvent, item: ClipboardItem) => void;
  onLongPress?: (item: ClipboardItem) => void;
  onClick?: (item: ClipboardItem) => void;
  onDragStart?: (e: React.DragEvent, item: ClipboardItem) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, item: ClipboardItem) => void;
}

const GoldCard: React.FC<GoldCardProps> = ({ 
  item, 
  index = 0,
  searchQuery = '', 
  isSelectionMode = false,
  isSelected = false,
  isDraggable = false,
  onMenuClick,
  onLongPress,
  onClick,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const { accentColor, isDarkTheme } = useSettings();
  
  // Logic Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    startCoords.current = null;
  };

  // --- Input Handlers ---

  const handleTouchStart = (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
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
      case ClipboardType.EMAIL:
        return <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
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
      
      // Auto-Title Logic
      if (item.title && item.title.trim()) {
          textToDisplay = item.title;
      } else {
          const rawContent = item.displayContent || item.content;
          if (rawContent.length > 60) {
              textToDisplay = rawContent.substring(0, 60) + '...';
          } else {
              textToDisplay = rawContent;
          }
      }

      if (!searchQuery) return textToDisplay;

      const parts = textToDisplay.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 text-black px-0.5 rounded-sm">{part}</span>
        ) : part
      );
  };

  // Card Styles
  // Premium Light: Pure white bg, subtle border, soft shadow. Active state darker white/gray.
  // Premium Dark: Zinc/Black mix.
  const cardBg = isDarkTheme 
    ? (isSelected ? 'bg-zinc-800' : 'bg-zinc-900/50') 
    : (isSelected ? 'bg-gray-100 ring-1 ring-inset ring-gray-300' : 'bg-white');
    
  const hoverEffect = isSelectionMode ? '' : (isDarkTheme ? 'hover:bg-zinc-800 hover:scale-[1.01]' : 'hover:shadow-lg hover:-translate-y-[2px] hover:scale-[1.01]');
  const activeEffect = isSelectionMode ? '' : 'active:scale-95 active:shadow-inner';
  const textColor = isDarkTheme ? 'text-zinc-200' : 'text-gray-900';
  const tagColor = isDarkTheme ? 'text-zinc-500' : 'text-gray-500';
  const borderColor = isDarkTheme ? 'border-white/5' : 'border-gray-200/80';

  // Animation stagger
  const animationDelay = `${index * 50}ms`;

  return (
    <div 
        className={`relative mb-3 transition-all duration-300 ease-out select-none touch-pan-y group animate-fade-in-up fill-mode-backwards ${isDraggable ? 'cursor-move' : 'cursor-pointer'} ${isSelectionMode ? 'mr-0' : ''}`}
        style={{ animationDelay }}
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
    >
      {/* Badges: Pinned & Favorite */}
      <div className="absolute -top-2 -right-1 z-20 flex space-x-1">
          {item.isFavorite && (
              <div className="bg-red-500 rounded-full p-1.5 shadow-sm border border-white dark:border-black animate-scale-in">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
                  </svg>
              </div>
          )}
          {item.isPinned && (
              <div className="bg-amber-400 rounded-full p-1.5 shadow-sm border border-white dark:border-black animate-scale-in">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" fill="white"/>
                  </svg>
              </div>
          )}
      </div>

      {/* Selection Overlay Indicator */}
      {isSelectionMode && (
          <div className={`absolute inset-y-0 right-4 flex items-center justify-end z-20 pointer-events-none transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-gold border-gold animate-scale-in' : 'border-gray-400'}`}>
                   {isSelected && <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
          </div>
      )}

      <div 
        className={`border rounded-2xl p-5 relative transition-all duration-300 shadow-sm ${cardBg} ${hoverEffect} ${activeEffect} ${borderColor}`}
      >
        <div className="flex justify-between items-start">
            {/* TEXT CONTENT - Dedicated Box with min-w-0 to fix overflow */}
            <div className={`flex-1 min-w-0 pr-4 ${isSelectionMode ? 'opacity-80' : ''}`}>
                <div className="w-full break-words">
                    <p className={`font-sans text-base font-medium leading-relaxed whitespace-normal line-clamp-3 ${textColor}`}>
                        {renderContent()}
                    </p>
                </div>
            </div>

            {/* ICONS (Type) */}
            {item.type !== ClipboardType.TEXT && (
                <div className="text-zinc-400 shrink-0 ml-2 mt-1">
                    <svg className="w-5 h-5" fill={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? 0 : 2}>
                        {getIcon(item.type)}
                    </svg>
                </div>
            )}
        </div>
        
        {/* FOOTER: Tags & Date */}
        <div className={`flex justify-between items-center mt-4 pt-3 border-t border-dashed ${isDarkTheme ? 'border-white/10' : 'border-black/5'}`}>
            <div className="flex items-center text-xs space-x-2 overflow-hidden">
                {item.tags.length > 0 ? item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${tagColor} ${isDarkTheme ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {tag}
                    </span>
                )) : <span className="text-[10px] opacity-30 italic">No tags</span>}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${tagColor} whitespace-nowrap ml-4 opacity-70`}>{item.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default GoldCard;