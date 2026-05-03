import React, { useEffect } from "react";

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

export const LogoLoop: React.FC<LogoLoopProps> = ({ height = 56, speed = 20 }) => {
  useEffect(() => {
    // Debug log to confirm component is mounted in the browser
    // Look for this message in the browser console: "LogoLoop mounted"
    // This helps verify the component is actually rendering for you.
    try {
      // eslint-disable-next-line no-console
      console.log("LogoLoop mounted, images:", images);
    } catch (e) {
      // ignore
    }
  }, []);
  const style = {
    track: {
      display: "flex",
      gap: "2rem",
      alignItems: "center",
      transform: "translate3d(0,0,0)",
    } as React.CSSProperties,
    wrapper: {
      overflow: "hidden",
    } as React.CSSProperties,
    img: {
      height: `${height}px`,
      width: "auto",
      objectFit: "contain",
      filter: "grayscale(0.05)",
      opacity: 0.95,
    } as React.CSSProperties,
  };

  const duration = `${speed}s`;

  return (
    <div id="logo-loop-debug" className="my-6 border-2 border-yellow-400 bg-yellow-50 p-3">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-2 text-center text-sm font-semibold text-yellow-700">Partner Logos</div>
        <div style={style.wrapper}>
        <div
          className="logo-loop-track"
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            animation: `logoLoop ${duration} linear infinite`,
          }}
        >
          {[...images, ...images].map((f, i) => (
            <div key={`${f}-${i}`} style={{ display: "flex", alignItems: "center" }}>
              <img
                src={`/images/${encodeURIComponent(f)}`}
                alt={`logo-${i}`}
                style={style.img}
                className="select-none"
              />
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
