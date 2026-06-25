import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const EMPTY_DRAG = {
  tracking: false,
  dragging: false,
  startX: 0,
  startY: 0,
  startScroll: 0,
  pointerId: null,
  suppressClickUntil: 0
};

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
  const dragRef = useRef({ ...EMPTY_DRAG });
  const frameRef = useRef(0);
  const [metrics, setMetrics] = useState({ left: 0, max: 0, client: 1, scroll: 1 });

  const refresh = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;
    const max = Math.max(0, node.scrollWidth - node.clientWidth);
    setMetrics({
      left: Math.max(0, node.scrollLeft),
      max,
      client: node.clientWidth || 1,
      scroll: node.scrollWidth || 1
    });
  }, []);

  const scheduleRefresh = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      refresh();
      frameRef.current = requestAnimationFrame(refresh);
    });
  }, [refresh]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;

    scheduleRefresh();

    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleRefresh) : null;
    resize?.observe(node);
    Array.from(node.children).forEach((child) => resize?.observe(child));

    const mutation = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(scheduleRefresh)
      : null;
    mutation?.observe(node, { childList: true, subtree: true, attributes: true, characterData: true });

    node.addEventListener('scroll', scheduleRefresh, { passive: true });
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);

    const fallbackTimer = window.setTimeout(scheduleRefresh, 120);

    return () => {
      window.clearTimeout(fallbackTimer);
      cancelAnimationFrame(frameRef.current);
      resize?.disconnect();
      mutation?.disconnect();
      node.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('orientationchange', scheduleRefresh);
    };
  }, [children, scheduleRefresh]);

  const overflow = metrics.max > 4;
  const canLeft = metrics.left > 3;
  const canRight = metrics.left < metrics.max - 3;
  const thumbWidth = useMemo(
    () => Math.max(18, Math.min(100, (metrics.client / metrics.scroll) * 100)),
    [metrics]
  );
  const thumbTravel = Math.max(0, 100 - thumbWidth);
  const thumbLeft = metrics.max > 0 ? (metrics.left / metrics.max) * thumbTravel : 0;

  const move = (direction) => {
    const node = viewportRef.current;
    if (!node) return;
    const distance = Math.max(140, node.clientWidth * step);
    node.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const pointerDown = (event) => {
    const node = viewportRef.current;
    if (!dragEnabled || !node) return;

    // Mouse, caneta e toque usam o mesmo motor. A direção só é capturada
    // depois que o gesto horizontal fica claro; gestos verticais continuam
    // livres para rolar a página.
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragRef.current = {
      tracking: true,
      dragging: false,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: node.scrollLeft,
      pointerId: event.pointerId,
      suppressClickUntil: 0
    };
  };

  const pointerMove = (event) => {
    const node = viewportRef.current;
    const drag = dragRef.current;
    if (!node || !drag.tracking || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.dragging) {
      if (Math.abs(deltaX) < 6) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        dragRef.current = { ...EMPTY_DRAG };
        return;
      }
      drag.dragging = true;
      node.setPointerCapture?.(event.pointerId);
      node.classList.add('is-dragging');
    }

    event.preventDefault();
    node.scrollLeft = drag.startScroll - deltaX;
  };

  const pointerEnd = (event) => {
    const node = viewportRef.current;
    const drag = dragRef.current;
    const didDrag = drag.dragging && drag.pointerId === event.pointerId;

    if (didDrag) {
      node?.releasePointerCapture?.(event.pointerId);
      node?.classList.remove('is-dragging');
    }

    dragRef.current = {
      ...EMPTY_DRAG,
      suppressClickUntil: didDrag
        ? performance.now() + 320
        : drag.suppressClickUntil
    };
    scheduleRefresh();
  };

  const clickCapture = (event) => {
    if (performance.now() < dragRef.current.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const wheel = (event) => {
    const node = viewportRef.current;
    if (!node || !overflow) return;

    // Trackpads já enviam deltaX. Shift + roda também deve navegar lateralmente.
    if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    }
  };

  const keyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      viewportRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }
    if (event.key === 'End') {
      event.preventDefault();
      viewportRef.current?.scrollTo({ left: metrics.max, behavior: 'smooth' });
    }
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
          <ChevronLeft size={17} />
        </button>
      )}

      <div
        ref={viewportRef}
        className={`horizontal-rail-viewport ${viewportClassName}`.trim()}
        aria-label={ariaLabel}
        role={viewportRole}
        tabIndex={0}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onLostPointerCapture={pointerEnd}
        onClickCapture={clickCapture}
        onWheel={wheel}
        onKeyDown={keyDown}
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
          <ChevronRight size={17} />
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
