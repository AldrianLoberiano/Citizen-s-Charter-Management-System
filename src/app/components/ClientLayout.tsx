/**
 * Client Layout Component
 * Public-facing layout with navigation header and footer
 */

import { Outlet, Link } from "react-router";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

const clientLogoSrc = new URL("../../public/images/header/calauan_logo-removebg-preview.png", import.meta.url).href;

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top announcement bar */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 text-center text-xs text-slate-200">
        Official Website of the Local Government Unit — For inquiries, contact
        the Information Officer
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          {/* Logo and System Name */}
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
              <img
                src={clientLogoSrc}
                alt="Calauan City Seal"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate leading-tight text-slate-900">
                Citizen's Charter
              </div>
              <div className="truncate text-xs text-slate-500">
                Management System
              </div>
            </div>
          </Link>

        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-slate-600">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-slate-900" />
                <span className="text-slate-900">Citizen's Charter</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                The Citizen's Charter is a document that communicates, in simple
                terms, information on the services provided by the government,
                the requirements needed to avail them, and the procedure to
                follow.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-3 text-slate-900">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-slate-500 transition-colors hover:text-slate-900">
                    Home
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-3 text-slate-900">Contact Information</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>Municipal Hall, Poblacion, Municipality</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>(000) 000-0000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span>info@municipality.gov.ph</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Citizen's Charter Management
              System. All Rights Reserved.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              In compliance with RA 11032 — Ease of Doing Business and Efficient
              Government Service Delivery Act
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
