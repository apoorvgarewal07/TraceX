import React from 'react';
import Link from 'next/link';
import { Shield, Activity, FileText, Database, ArrowRight, Server } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-white text-lg">CRYPTOFRAUD<span className="text-cyan-400">TRACE</span></span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  I4C v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Law Enforcement Blockchain Forensics</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">New Investigation</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Cases & Traces</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Docs</span>
          </a>
        </nav>
      </div>
    </header>
  );
};
