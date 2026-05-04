
  import { useEffect, useState } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { syncLocalCacheFromApi } from "./app/store/apiSync";

  function BootstrapApp() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      syncLocalCacheFromApi().finally(() => setReady(true));
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

  createRoot(document.getElementById("root")!).render(<BootstrapApp />);
  