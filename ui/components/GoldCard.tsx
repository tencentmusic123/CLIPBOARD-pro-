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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // --- Long Press Logic ---
  const handleStart = () => {
    isDragging.current = false;
    timerRef.current = setTimeout(() => {
        if (!isDragging.current && onLongPress) {
            onLongPress(item);
        }
    }, 500);
  };

  const handleEnd = () => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setSwipeOffset(0);
    touchStartX.current = null;
  };

  const handleMove = () => {
      isDragging.current = true;
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
  };

  // --- Swipe Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
      handleStart();
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      handleMove();
      if (touchStartX.current !== null && item.isPinned && onUnpin && !isSelectionMode) {
          const currentX = e.touches[0].clientX;
          const diff = currentX - touchStartX.current;
          if (diff > 0) {
              setSwipeOffset(Math.min(diff, 100));
          }
      }
  };

  const handleTouchEnd = () => {
      if (swipeOffset > 80 && item.isPinned && onUnpin && !isSelectionMode) {
          onUnpin(item);
      }
      handleEnd();
  };

  const handleClick = (e: React.MouseEvent) => {
      if (isDragging.current) return;
      if (onClick) onClick(item);
  };

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
      const text = item.displayContent || item.content;
      if (!searchQuery) return text;
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
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
        className={`relative mb-4 transition-transform active:scale-[0.99] select-none touch-pan-y ${isDraggable ? 'cursor-move' : 'cursor-pointer'}`}
        draggable={isDraggable && !isSelectionMode}
        onDragStart={(e) => onDragStart && onDragStart(e, item)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop && onDrop(e, item)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onClick={handleClick}
        style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      {swipeOffset > 0 && (
          <div className="absolute inset-y-0 left-0 w-full bg-red-900/50 rounded-3xl flex items-center pl-4 -z-10">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
              </svg>
          </div>
      )}

      <div 
        className={`border rounded-3xl p-4 relative group transition-colors ${cardBg}`}
        style={{ borderColor: accentColor }}
      >
        <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
                <p className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-words ${textColor}`}>
                    {renderContent()}
                </p>
                <div className="flex items-center mt-3 text-xs">
                    {item.tags.map((tag) => (
                    <span key={tag} className={`mr-3 ${tagColor}`}>{tag}</span>
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col items-end justify-between h-full">
                {item.type !== ClipboardType.TEXT && (
                    <svg className="w-6 h-6 mb-4" style={{ color: accentColor }} fill={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={item.type === ClipboardType.PHONE || item.type === ClipboardType.SECURE ? 0 : 2}>
                        {getIcon(item.type)}
                    </svg>
                )}
                {item.type === ClipboardType.TEXT && item.isPinned && (
                    <svg className="w-5 h-5 text-red-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                )}
            </div>
        </div>
        
        <div className="flex justify-end mt-2">
            <span className={`text-[10px] ${tagColor}`}>{item.timestamp}</span>
        </div>
        
        {!isSelectionMode && (
            <div 
                onClick={(e) => { e.stopPropagation(); onMenuClick && onMenuClick(e, item); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 p-2 cursor-pointer z-10"
            >
                <svg className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" style={{ color: accentColor }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
            </div>
        )}

        {isSelectionMode && (
            <div className={`absolute inset-0 z-20 flex items-center justify-end pr-4 rounded-3xl transition-colors ${isSelected ? 'ring-2' : 'bg-black/40'}`} style={{ backgroundColor: isSelected ? `${accentColor}1A` : undefined, borderColor: isSelected ? accentColor : undefined, ringColor: isSelected ? accentColor : undefined }}>
                {isSelected ? (
                    <svg className="w-8 h-8 drop-shadow-md" style={{ color: isDarkTheme ? 'white' : accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-black/50"></div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default GoldCard;