import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.('button, a, input, textarea, select, label, summary, [role="button"], [data-no-rail-drag]'));
}

export function HorizontalRail({
  children,
  className = '',
  viewportClassName = '',
  ariaLabel = 'Conteúdo horizontal',
  step = 0.72,
  showControls = true,
  viewportRole,
  dragEnabled = true
}) {
  const viewportRef = useRef(null);
  const dragRef = useRef({ tracking: false, dragging: false, startX: 0, startScroll: 0, pointerId: null });
  const [metrics, setMetrics] = useState({ left: 0, max: 0, client: 1, scroll: 1 });

  const refresh = () => {
    const node = viewportRef.current;
    if (!node) return;
    const max = Math.max(0, node.scrollWidth - node.clientWidth);
    setMetrics({ left: node.scrollLeft, max, client: node.clientWidth || 1, scroll: node.scrollWidth || 1 });
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;
    refresh();
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    resize?.observe(node);
    Array.from(node.children).forEach((child) => resize?.observe(child));
    node.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    const fallbackTimer = window.setTimeout(refresh, 60);
    return () => {
      window.clearTimeout(fallbackTimer);
      resize?.disconnect();
      node.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [children]);

  const overflow = metrics.max > 6;
  const canLeft = metrics.left > 4;
  const canRight = metrics.left < metrics.max - 4;
  const thumbWidth = useMemo(() => Math.max(18, Math.min(100, (metrics.client / metrics.scroll) * 100)), [metrics]);
  const thumbTravel = Math.max(0, 100 - thumbWidth);
  const thumbLeft = metrics.max > 0 ? (metrics.left / metrics.max) * thumbTravel : 0;

  const move = (direction) => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * step, behavior: 'smooth' });
  };

  const pointerDown = (event) => {
    const node = viewportRef.current;
    if (!dragEnabled || event.pointerType === 'touch' || !node || isInteractiveTarget(event.target)) {
      dragRef.current = { tracking: false, dragging: false, startX: 0, startScroll: 0, pointerId: null };
      return;
    }
    dragRef.current = {
      tracking: true,
      dragging: false,
      startX: event.clientX,
      startScroll: node.scrollLeft,
      pointerId: event.pointerId
    };
  };

  const pointerMove = (event) => {
    const node = viewportRef.current;
    const drag = dragRef.current;
    if (!node || !drag.tracking || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.dragging && Math.abs(delta) < 7) return;
    if (!drag.dragging) {
      drag.dragging = true;
      node.setPointerCapture?.(event.pointerId);
      node.classList.add('is-dragging');
    }
    event.preventDefault();
    node.scrollLeft = drag.startScroll - delta;
  };

  const pointerEnd = (event) => {
    const node = viewportRef.current;
    const drag = dragRef.current;
    if (drag.dragging && drag.pointerId === event.pointerId) {
      node?.releasePointerCapture?.(event.pointerId);
      node?.classList.remove('is-dragging');
    }
    dragRef.current = { tracking: false, dragging: false, startX: 0, startScroll: 0, pointerId: null };
  };

  return (
    <div className={`horizontal-rail ${overflow ? 'horizontal-rail-overflow' : ''} ${className}`.trim()}>
      {showControls && overflow && (
        <button
          type="button"
          className="horizontal-rail-arrow horizontal-rail-arrow-left"
          onClick={() => move(-1)}
          disabled={!canLeft}
          aria-label="Rolar para a esquerda"
          data-no-rail-drag
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <div
        ref={viewportRef}
        className={`horizontal-rail-viewport ${viewportClassName}`.trim()}
        aria-label={ariaLabel}
        role={viewportRole}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
      >
        {children}
      </div>
      {showControls && overflow && (
        <button
          type="button"
          className="horizontal-rail-arrow horizontal-rail-arrow-right"
          onClick={() => move(1)}
          disabled={!canRight}
          aria-label="Rolar para a direita"
          data-no-rail-drag
        >
          <ChevronRight size={16} />
        </button>
      )}
      {overflow && (
        <div className="horizontal-rail-progress" aria-hidden="true">
          <span style={{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }} />
        </div>
      )}
    </div>
  );
}
