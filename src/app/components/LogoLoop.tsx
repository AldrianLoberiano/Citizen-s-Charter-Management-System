import React, { useEffect } from "react";

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
];

// Resolve local image URLs from src/public/images using Vite import meta URL
const imageUrls = images.map((f) => {
  try {
    return new URL(`../../public/images/${f}`, import.meta.url).href;
  } catch (e) {
    return `/images/${encodeURIComponent(f)}`;
  }
});

const loopImages = [...imageUrls, imageUrls[0]];

export const LogoLoop: React.FC<LogoLoopProps> = ({ height = 88, speed = 20 }) => {
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

  const style = {
    wrapper: {
      overflow: "hidden",
      background: "transparent",
    } as React.CSSProperties,
    track: {
      display: "inline-flex",
      width: "max-content",
      alignItems: "center",
      transform: "translate3d(0,0,0)",
    } as React.CSSProperties,
    group: {
      display: "inline-flex",
      alignItems: "center",
      gap: 0,
      whiteSpace: "nowrap",
      marginRight: "-1px",
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
            className="logo-loop-track"
            style={{
              ...style.track,
              animation: `logoLoop ${duration} linear infinite`,
            }}
          >
            <div style={style.group}>
              {loopImages.map((src, i) => (
                <div key={`a-${src}-${i}`} style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={src}
                    alt={`logo-${i}`}
                    style={style.img}
                    className="select-none"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
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

      <style>{`\n        @keyframes logoLoop {\n          0% { transform: translateX(0); }\n          100% { transform: translateX(-50%); }\n        }\n        .logo-loop-track {\n          will-change: transform;\n        }\n      `}</style>
    </div>
  );
};

export default LogoLoop;
