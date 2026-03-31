import { useState, useCallback, useRef } from 'react';

const GRID_SNAP = 24; // ~6mm at 96dpi

function snapToGrid(val) {
  return Math.round(val / GRID_SNAP) * GRID_SNAP;
}

/**
 * Hook for snap-to-grid draggable panels.
 * Each panel has a position {x, y} and size {w, h} snapped to GRID_SNAP increments.
 */
export default function useDragGrid(initialPanels, containerRef) {
  const [panels, setPanels] = useState(initialPanels);
  const dragState = useRef(null);

  const startDrag = useCallback((panelId, e, mode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    dragState.current = {
      id: panelId,
      mode,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: panel.x,
      startY: panel.y,
      startW: panel.w,
      startH: panel.h,
    };

    const onMouseMove = (ev) => {
      if (!dragState.current) return;
      const ds = dragState.current;
      const dx = ev.clientX - ds.startMouseX;
      const dy = ev.clientY - ds.startMouseY;

      setPanels(prev => prev.map(p => {
        if (p.id !== ds.id) return p;
        if (ds.mode === 'move') {
          return {
            ...p,
            x: snapToGrid(Math.max(0, ds.startX + dx)),
            y: snapToGrid(Math.max(0, ds.startY + dy)),
          };
        }
        if (ds.mode === 'resize') {
          return {
            ...p,
            w: snapToGrid(Math.max(GRID_SNAP * 4, ds.startW + dx)),
            h: snapToGrid(Math.max(GRID_SNAP * 4, ds.startH + dy)),
          };
        }
        return p;
      }));
    };

    const onMouseUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panels]);

  return { panels, setPanels, startDrag, GRID_SNAP };
}
