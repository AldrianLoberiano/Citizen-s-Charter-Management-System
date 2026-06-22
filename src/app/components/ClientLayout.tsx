/**
 * Client Layout Component
 * Public-facing layout with navigation header and footer
 */

import { Outlet, Link, useLocation } from "react-router";
import { Mail, Facebook, MapPin, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const clientLogoSrc = new URL("../../public/images/header/logo.png", import.meta.url).href;
const clientHeaderBgSrc = new URL("../../public/images/header/header1.png", import.meta.url).href;
const mayorAssistantSrc = new URL(
  "../../public/images/header/mayor.png",
  import.meta.url
).href;

export function ClientLayout() {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);


  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const hideDelayMs = 6000;
    const hideTimer = setTimeout(() => {
      setShowHelp(false);
      setAssistantVisible(false);
    }, hideDelayMs);

    if (showHelp) {
      setAssistantVisible(true);
    }

    return () => {
      clearTimeout(hideTimer);
    };
  }, [showHelp]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <div className="fixed bottom-15 right-4 z-50 flex flex-col items-end">
        {showHelp && (
          <div
            id="help-panel"
            className="mb-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-200 shadow-lg"
          >
            <div className="mb-1 text-slate-900 dark:text-slate-100">
              How to use the Citizen's Charter
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Choose a department, open a service charter, then follow the
              requirements and steps listed.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className={
            "h-16 w-16 bg-transparent p-0 focus:outline-none transition " +
            "md:h-20 md:w-20 " +
            (showHelp || assistantVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-60")
          }
          aria-pressed={showHelp}
          aria-controls="help-panel"
          title="Need help?"
        >
          <img
            src={mayorAssistantSrc}
            alt="Assistant"
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </button>
      </div>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg transition hover:bg-slate-800 dark:hover:bg-white"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="bg-slate-950 px-4 py-2 text-center text-xs text-slate-200">
        Official Website of the Local Government Unit – For inquiries, contact
        the Information Officer
      </div>

      <header
        className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 shadow-none sm:shadow-sm dark:shadow-none"
        style={{
          backgroundImage: `url(${clientHeaderBgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
          <Link to="/" className="flex items-center gap-5 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white p-0.5">
              <img
                src={clientLogoSrc}
                alt="Calauan City Seal"
                className="h-full w-full scale-165 object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate leading-tight text-white">
                Calauan Citizen's Charter
              </div>
              <div className="truncate text-xs text-slate-200">
                Municipality of Calauan
              </div>
            </div>
          </Link>

        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
        <div className="mx-auto w-full px-6 py-10 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1.25fr_1fr]">
            <div>
              <div className="mb-3 flex items-center gap-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white p-0.5">
                  <img
                    src={clientLogoSrc}
                    alt="Calauan City Seal"
                    className="h-full w-full scale-165 object-contain"
                  />
                </div>
                <span className="text-slate-900 dark:text-slate-100 leading-none">
                  Calauan Citizen's Charter
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                The Calauan Citizen's Charter is a document that communicates, in simple
                terms, information on the services provided by the government,
                the requirements needed to avail them, and the procedure to
                follow.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-slate-900 dark:text-slate-100">Contact Information</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <a
                    href="https://www.google.com/maps/search/Municipal+Hall+Calauan+Laguna"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>lgucalauanbplo@gmail.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>Business Permit and Licensing Office - Calauan, Laguna</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Citizen's Charter Management
              System. All Rights Reserved.
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              In compliance with RA 11032 – Ease of Doing Business and Efficient
              Government Service Delivery Act
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}