import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface LogoLoopProps {
  height?: number;
  speed?: number; // seconds
}

const images = [
  "sb-removebg-preview.png",
  "mto-removebg-preview.png",
  "mpdc-removebg-preview.png",
  "mho-removebg-preview.png",
  "mdrrmo-removebg-preview.png",
  "hrmo-removebg-preview.png",
  "ctmo-removebg-preview.png",
  "bplo-removebg-preview.png",
  "assesors_office-removebg-preview.png",
  "AgriOffice-removebg-preview.png",
  "lydo.png",
  "osca.png",
  "peso.png",
];

// Resolve local image URLs from src/public/images using Vite import meta URL
const imageUrls = images.map((f) => {
  try {
    return new URL(`../../public/images/${f}`, import.meta.url).href;
  } catch (e) {
    return `/images/${encodeURIComponent(f)}`;
  }
});

const loopImages = imageUrls;

export const LogoLoop: React.FC<LogoLoopProps> = ({ height = 88, speed = 20 }) => {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const logoGapPx = 16; // 1rem

  useEffect(() => {
    const existing = new Set(
      Array.from(document.head.querySelectorAll('link[data-logo-loop-preload="true"]')).map(
        (node) => node.getAttribute("href") || ""
      )
    );

    const links = imageUrls
      .filter((src) => !existing.has(src))
      .map((src) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        link.setAttribute("data-logo-loop-preload", "true");
        document.head.appendChild(link);
        return link;
      });

    return () => {
      links.forEach((link) => link.remove());
    };
  }, []);

  // JS preload images and mark when each is ready; used to show placeholders immediately
  useEffect(() => {
    const toLoad = imageUrls.slice(0, imageUrls.length);
    let cancelled = false;
    toLoad.forEach((src) => {
      if (loaded[src]) return;
      const img = new Image();
      img.src = src;
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        setLoaded((s) => ({ ...s, [src]: true }));
      };
      img.onerror = () => {
        if (cancelled) return;
        setLoaded((s) => ({ ...s, [src]: false }));
      };
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Measure first group width and set CSS variable to shift exactly that many pixels
  useLayoutEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;
    const setShift = () => {
      const w = group.getBoundingClientRect().width;
      // Shift by one full group plus the inter-group gap so seam spacing stays consistent.
      track.style.setProperty("--logo-shift", `${w + logoGapPx}px`);
      track.style.setProperty("--logo-duration", `${speed}s`);
      track.style.setProperty("--logo-start", "16px");
    };
    setShift();
    // Pause animation until we finish measurement and first images are ready
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
    // Recompute on resize
    const ro = new ResizeObserver(setShift);
    ro.observe(group);
    window.addEventListener("load", setShift);
    window.addEventListener("resize", setShift);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", setShift);
      window.removeEventListener("resize", setShift);
    };
  }, [speed]);

  // Start animation when at least one visible image has loaded (or after timeout)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let started = false;
    const tryStart = () => {
      if (started) return;
      const anyLoaded = imageUrls.some((src) => loaded[src]);
      if (anyLoaded) {
        track.style.animationPlayState = "running";
        started = true;
      }
    };
    // attempt immediately
    tryStart();
    // fallback: start after 500ms even if images not loaded to avoid permanent pause
    const t = setTimeout(() => {
      if (!started) {
        track.style.animationPlayState = "running";
        started = true;
      }
    }, 500);
    return () => clearTimeout(t);
  }, [loaded]);

  const style = {
    wrapper: {
      overflow: "hidden",
      background: "transparent",
      paddingLeft: "0.5rem",
      paddingRight: "0.5rem",
    } as React.CSSProperties,
    track: {
      display: "flex",
      width: "max-content",
      alignItems: "center",
      columnGap: `${logoGapPx}px`,
      transform: "translate3d(0,0,0)",
      // use CSS vars: --logo-shift and --logo-duration are set at runtime
      animation: "logoLoop var(--logo-duration, 20s) linear infinite",
    } as React.CSSProperties,
    group: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    img: {
      height: `${height}px`,
      width: "auto",
      objectFit: "contain",
      filter: "none",
      opacity: 1,
    } as React.CSSProperties,
  };

  const duration = `${speed}s`;

  return (
    <div className="my-8 bg-transparent">
      <div className="mx-auto max-w-7xl px-4">
        <div style={style.wrapper} aria-label="Partner logos">
          <div
            ref={trackRef}
            className="logo-loop-track"
            style={{
              ...style.track,
            }}
          >
              <div ref={groupRef} style={style.group}>
                {loopImages.map((src, i) => (
                  <div key={`a-${src}-${i}`} style={{ display: "flex", alignItems: "center" }}>
                    {loaded[src] ? (
                      <img
                        src={src}
                        alt={`logo-${i}`}
                        style={style.img}
                        className="select-none"
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <div
                        aria-hidden
                        style={{
                          ...style.img,
                          display: "inline-block",
                          minWidth: Math.round(height * 1.2) + "px",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            <div style={style.group} aria-hidden="true">
              {loopImages.map((src, i) => (
                <div key={`b-${src}-${i}`} style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={src}
                    alt=""
                    style={style.img}
                    className="select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`\n        @keyframes logoLoop {\n          0% { transform: translateX(var(--logo-start, 0px)); }\n          100% { transform: translateX(calc(var(--logo-start, 0px) + (var(--logo-shift) * -1))); }\n        }\n        .logo-loop-track {\n          will-change: transform;\n          animation: logoLoop var(--logo-duration, 20s) linear infinite;\n        }\n      `}</style>
    </div>
  );
};

export default LogoLoop;
