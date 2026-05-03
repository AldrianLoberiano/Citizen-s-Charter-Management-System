import React from "react";

interface LogoLoopProps {
  height?: number;
  speed?: number; // seconds
}

const images = [
  "sb.jpg",
  "mto.jpg",
  "mpdc.jpg",
  "mho.png",
  "mdrrmo.jpg",
  "hrmo.jpg",
  "ctmo.jpg",
  "bplo.jpg",
  "assesors office.jpg",
  "AgriOffice.jpg",
];

// Resolve local image URLs from src/public/images using Vite import meta URL
const imageUrls = images.map((f) => {
  try {
    return new URL(`../../public/images/${f}`, import.meta.url).href;
  } catch (e) {
    return `/images/${encodeURIComponent(f)}`;
  }
});

export const LogoLoop: React.FC<LogoLoopProps> = ({ height = 88, speed = 20 }) => {
  const style = {
    track: {
      display: "flex",
      gap: "3rem",
      alignItems: "center",
      transform: "translate3d(0,0,0)",
      paddingBlock: "0.5rem",
    } as React.CSSProperties,
    wrapper: {
      overflow: "hidden",
      background: "transparent",
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
            {[...imageUrls, ...imageUrls].map((src, i) => (
              <div key={`${src}-${i}`} style={{ display: "flex", alignItems: "center" }}>
                <img src={src} alt={`logo-${i}`} style={style.img} className="select-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`\n        @keyframes logoLoop {\n          0% { transform: translateX(0); }\n          100% { transform: translateX(-50%); }\n        }\n        .logo-loop-track {\n          will-change: transform;\n        }\n      `}</style>
    </div>
  );
};

export default LogoLoop;
