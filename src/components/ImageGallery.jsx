import { useState, useRef } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, X } from 'lucide-react';

/**
 * Product image gallery with:
 * - Thumbnail strip (up to 5 images)
 * - Click thumbnails to switch main image
 * - Click main image to open fullscreen zoom
 * - Pinch-to-zoom on mobile (touch)
 * - Smooth transitions
 */
export default function ImageGallery({ images, title, condition }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });

  const validImages = (images || []).filter(Boolean);
  const hasImages = validImages.length > 0;
  const currentImage = hasImages ? validImages[activeIndex] : null;

  const handleThumbnailClick = (index) => {
    setActiveIndex(index);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPan.current = { ...panOffset };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanOffset({
      x: lastPan.current.x + dx,
      y: lastPan.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const closeZoom = () => {
    setIsZoomed(false);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="w-full lg:w-1/2">
        {/* Main Image */}
        <div
          className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden aspect-square group relative cursor-zoom-in"
          onClick={() => hasImages && setIsZoomed(true)}
        >
          {hasImages ? (
            <img
              src={currentImage}
              alt={title || 'Product image'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <ImageIcon className="w-16 h-16" />
            </div>
          )}

          {/* Condition badge */}
          {condition && (
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm capitalize z-10">
              {condition.replace('_', ' ')}
            </div>
          )}
          {hasImages && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> Tap to zoom
            </div>
          )}

          {/* Image counter */}
          {validImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
              {activeIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {validImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
            {validImages.map((img, i) => (
              <button
                key={i}
                onClick={() => handleThumbnailClick(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  activeIndex === i
                    ? 'border-[#ff385c] shadow-md shadow-[#ff385c]/20'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`${title || 'Product'} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && hasImages && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={closeZoom}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <span className="text-white/70 text-sm font-medium">
              {activeIndex + 1} / {validImages.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={closeZoom}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoomable Image */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={currentImage}
              alt={title || 'Product image'}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
              draggable={false}
            />
          </div>

          {/* Thumbnail strip in zoom modal */}
          {validImages.length > 1 && (
            <div className="flex justify-center gap-2 py-4 flex-shrink-0">
              {validImages.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); handleThumbnailClick(i); }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeIndex === i ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
