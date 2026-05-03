/**
 * Client Layout Component
 * Public-facing layout with navigation header and footer
 */

import { Outlet, Link } from "react-router";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top announcement bar */}
      <div className="bg-blue-900 text-blue-100 text-xs py-1.5 px-4 text-center">
        Official Website of the Local Government Unit — For inquiries, contact
        the Information Officer
      </div>

      {/* Main Navigation Header */}
      <header className="bg-blue-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo and System Name */}
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-blue-800" />
            </div>
            <div className="min-w-0">
              <div className="text-white leading-tight truncate">
                Citizen's Charter
              </div>
              <div className="text-blue-200 text-xs truncate">
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
      <footer className="bg-slate-800 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-white">Citizen's Charter</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The Citizen's Charter is a document that communicates, in simple
                terms, information on the services provided by the government,
                the requirements needed to avail them, and the procedure to
                follow.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white mb-3">Contact Information</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
                  <span>Municipal Hall, Poblacion, Municipality</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-slate-500" />
                  <span>(000) 000-0000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0 text-slate-500" />
                  <span>info@municipality.gov.ph</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Citizen's Charter Management
              System. All Rights Reserved.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              In compliance with RA 11032 — Ease of Doing Business and Efficient
              Government Service Delivery Act
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
