import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";

type ScrollDirection = "vertical" | "horizontal" | "both";

interface IGhostScrollbarProps {
  direction?: ScrollDirection;
  thumbSize?: number;
  thumbColor?: string;
  thumbHoverColor?: string;
  thumbActiveColor?: string;
  thumbRadius?: number;
  minThumbLength?: number;
  hideDelay?: number;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function GhostScrollbar({
  direction = "vertical",
  thumbSize = 8,
  thumbColor = "rgba(108, 112, 134, 0.45)",
  thumbHoverColor = "rgba(108, 112, 134, 0.65)",
  thumbActiveColor = "rgba(108, 112, 134, 0.8)",
  thumbRadius = 4,
  minThumbLength = 20,
  hideDelay = 800,
  className = "",
  contentClassName = "",
  style,
  children,
}: IGhostScrollbarProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  const verticalThumbRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const horizontalThumbRef = useRef<HTMLDivElement>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef<{
    axis: "v" | "h";
    startMouse: number;
    startScroll: number;
    trackSpace: number;
  } | null>(null);

  const updateThumbs = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = element;

    const wantVertical =
      (direction === "vertical" || direction === "both") &&
      scrollHeight > clientHeight;
    const wantHorizontal =
      (direction === "horizontal" || direction === "both") &&
      scrollWidth > clientWidth;

    // vertical
    if (verticalTrackRef.current && verticalThumbRef.current) {
      if (wantVertical) {
        verticalTrackRef.current.style.display = "";
        verticalTrackRef.current.style.height = `${clientHeight}px`;

        const ratio = clientHeight / scrollHeight;
        const thumbLen = Math.max(minThumbLength, ratio * clientHeight);
        const trackSpace = clientHeight - thumbLen;
        const scrollRange = scrollHeight - clientHeight;
        const top =
          scrollRange > 0 ? (scrollTop / scrollRange) * trackSpace : 0;

        verticalThumbRef.current.style.height = `${thumbLen}px`;
        verticalThumbRef.current.style.transform = `translateY(${top}px)`;
      } else {
        verticalTrackRef.current.style.display = "none";
      }
    }

    // horizontal
    if (horizontalTrackRef.current && horizontalThumbRef.current) {
      if (wantHorizontal) {
        horizontalTrackRef.current.style.display = "";
        horizontalTrackRef.current.style.width = `${clientWidth}px`;

        const ratio = clientWidth / scrollWidth;
        const thumbLen = Math.max(minThumbLength, ratio * clientWidth);
        const trackSpace = clientWidth - thumbLen;
        const scrollRange = scrollWidth - clientWidth;
        const left =
          scrollRange > 0 ? (scrollLeft / scrollRange) * trackSpace : 0;

        horizontalThumbRef.current.style.width = `${thumbLen}px`;
        horizontalThumbRef.current.style.transform = `translateX(${left}px)`;
      } else {
        horizontalTrackRef.current.style.display = "none";
      }
    }
  }, [direction, minThumbLength]);

  const setTrackOpacity = useCallback((opacity: string) => {
    if (verticalTrackRef.current)
      verticalTrackRef.current.style.opacity = opacity;
    if (horizontalTrackRef.current)
      horizontalTrackRef.current.style.opacity = opacity;
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    hideTimer.current = null;
    setTrackOpacity("1");
  }, [setTrackOpacity]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    hideTimer.current = setTimeout(() => setTrackOpacity("0"), hideDelay);
  }, [hideDelay, setTrackOpacity]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const onScroll = () => {
      updateThumbs();
      show();
      scheduleHide();
    };

    element.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateThumbs());
    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(() => updateThumbs());
    mutationObserver.observe(element, { childList: true, subtree: true });

    updateThumbs();

    return () => {
      element.removeEventListener("scroll", onScroll);

      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateThumbs, show, scheduleHide]);

  const onThumbPointerDown = useCallback(
    (axis: "v" | "h", event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const element = contentRef.current!;
      const thumbElement =
        axis === "v" ? verticalThumbRef.current! : horizontalThumbRef.current!;

      (event.target as HTMLElement).setPointerCapture(event.pointerId);

      let trackSpace: number;

      if (axis === "v") {
        const ratio = element.clientHeight / element.scrollHeight;
        const thumbLen = Math.max(minThumbLength, ratio * element.clientHeight);

        trackSpace = element.clientHeight - thumbLen;
      } else {
        const ratio = element.clientWidth / element.scrollWidth;
        const thumbLen = Math.max(minThumbLength, ratio * element.clientWidth);

        trackSpace = element.clientWidth - thumbLen;
      }

      dragging.current = {
        axis,
        startMouse: axis === "v" ? event.clientY : event.clientX,
        startScroll: axis === "v" ? element.scrollTop : element.scrollLeft,
        trackSpace,
      };

      thumbElement.style.background = thumbActiveColor;
      show();
    },
    [show, thumbActiveColor, minThumbLength],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragging.current) return;

    const { axis, startMouse, startScroll, trackSpace } = dragging.current;
    const delta =
      axis === "v" ? event.clientY - startMouse : event.clientX - startMouse;

    const element = contentRef.current!;

    if (axis === "v") {
      const scrollRange = element.scrollHeight - element.clientHeight;

      element.scrollTop = startScroll + delta * (scrollRange / trackSpace);
    } else {
      const scrollRange = element.scrollWidth - element.clientWidth;

      element.scrollLeft = startScroll + delta * (scrollRange / trackSpace);
    }
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!dragging.current) return;

      const { axis } = dragging.current;
      const thumbElement =
        axis === "v" ? verticalThumbRef.current : horizontalThumbRef.current;

      if (thumbElement) thumbElement.style.background = thumbColor;

      dragging.current = null;
      scheduleHide();
    },
    [scheduleHide, thumbColor],
  );

  const onTrackClick = useCallback(
    (axis: "v" | "h", event: React.MouseEvent) => {
      if ((event.target as HTMLElement).dataset.thumb) return;

      const el = contentRef.current!;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

      if (axis === "v") {
        const ratio = (event.clientY - rect.top) / rect.height;
        el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
      } else {
        const ratio = (event.clientX - rect.left) / rect.width;
        el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
      }
    },
    [],
  );

  const onThumbEnter = useCallback(
    (axis: "v" | "h") => {
      if (dragging.current) return;

      const element =
        axis === "v" ? verticalThumbRef.current : horizontalThumbRef.current;

      if (element) element.style.background = thumbHoverColor;
    },
    [thumbHoverColor],
  );

  const onThumbLeave = useCallback(
    (axis: "v" | "h") => {
      if (dragging.current) return;

      const element =
        axis === "v" ? verticalThumbRef.current : horizontalThumbRef.current;

      if (element) element.style.background = thumbColor;
    },
    [thumbColor],
  );

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ ...style, overflow: "hidden" }}
      onMouseEnter={show}
      onMouseLeave={() => {
        if (!dragging.current) scheduleHide();
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={contentRef}
        className={`no-scrollbar ${contentClassName}`}
        style={{
          width: "100%",
          height: "100%",
          overflowX:
            direction === "horizontal" || direction === "both"
              ? "auto"
              : "hidden",
          overflowY:
            direction === "vertical" || direction === "both"
              ? "auto"
              : "hidden",
        }}
        onWheel={(e) => {
          if (direction === "horizontal" && e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {children}
      </div>

      <div
        ref={verticalTrackRef}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: thumbSize + 4,
          cursor: "default",
          zIndex: 10,
          opacity: 0,
          transition: "opacity 200ms ease",
          display: "none",
        }}
        onClick={(e) => onTrackClick("v", e)}
      >
        <div
          ref={verticalThumbRef}
          data-thumb="true"
          style={{
            position: "absolute",
            top: 0,
            right: 1,
            width: thumbSize,
            borderRadius: thumbRadius,
            background: thumbColor,
            transition: "background 100ms ease",
            cursor: "default",
            willChange: "transform",
          }}
          onMouseEnter={() => onThumbEnter("v")}
          onMouseLeave={() => onThumbLeave("v")}
          onPointerDown={(e) => onThumbPointerDown("v", e)}
        />
      </div>

      <div
        ref={horizontalTrackRef}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: thumbSize + 4,
          cursor: "default",
          zIndex: 10,
          opacity: 0,
          transition: "opacity 200ms ease",
          display: "none",
        }}
        onClick={(e) => onTrackClick("h", e)}
      >
        <div
          ref={horizontalThumbRef}
          data-thumb="true"
          style={{
            position: "absolute",
            bottom: 1,
            left: 0,
            height: thumbSize,
            borderRadius: thumbRadius,
            background: thumbColor,
            transition: "background 100ms ease",
            cursor: "default",
            willChange: "transform",
          }}
          onMouseEnter={() => onThumbEnter("h")}
          onMouseLeave={() => onThumbLeave("h")}
          onPointerDown={(e) => onThumbPointerDown("h", e)}
        />
      </div>
    </div>
  );
}
