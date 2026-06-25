
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { syncLocalCacheFromApi, startPolling, stopPolling } from "./app/store/apiSync";

function BootstrapApp() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      syncLocalCacheFromApi().finally(() => {
        setReady(true);
        startPolling(5000);
      });
      return () => stopPolling();
    }, []);

    if (!ready) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-slate-600">
          Loading Calauan Citizen's Charter...
        </div>
      );
    }

    return <App />;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const globalScope = globalThis as typeof globalThis & {
  __ccmsRoot?: ReturnType<typeof createRoot>;
};

const root = globalScope.__ccmsRoot ?? createRoot(rootElement);
globalScope.__ccmsRoot = root;

root.render(<BootstrapApp />);
  