import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { ShieldCheck, X, Lock, HardDrive, Cpu, Mail } from 'lucide-react';

export const PrivacyModal: React.FC = () => {
  const isOpen = useLogStore((state) => state.isPrivacyOpen);
  const setIsOpen = useLogStore((state) => state.setPrivacyOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Privacy Policy</h3>
              <p className="text-[11px] text-slate-400">Effective Date: August 27, 2026</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-300 leading-relaxed">
          {/* Key Privacy Highlights Card */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>100% Client-Side & Local Execution Guarantee</span>
            </div>
            <p className="text-slate-300 text-xs">
              <strong>MongoLens does not upload, transmit, store, or process your MongoDB log files on any remote servers.</strong> All file decompression, streaming analysis, and index evaluations occur entirely inside your local web browser using dedicated client-side Web Workers and Web Streams.
            </p>
          </div>

          {/* Section 1: Data Processing */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>1. How Your Log Data is Handled</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>No Cloud Uploads:</strong> When you select or drag-and-drop a log file (`.log`, `.txt`, `.gz`, `.zip`), it remains in your browser's sandboxed memory.
              </li>
              <li>
                <strong>Ephemeral Memory:</strong> Analyzed log entries, slow query commands, execution plans, and collection statistics exist solely in transient JavaScript memory and are discarded as soon as you close or refresh your browser tab.
              </li>
              <li>
                <strong>No Database Credentials:</strong> MongoLens does not connect to your live MongoDB instances and never requires database connection strings, passwords, or network credentials.
              </li>
            </ul>
          </div>

          {/* Section 2: Telemetry & Analytics */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>2. Telemetry and Analytics</span>
            </h4>
            <p className="text-slate-300">
              We use Google Analytics (GA4) with IP anonymization enabled strictly to measure high-level aggregate usage (such as total page visits, user interface responsiveness, and export feature usage). We <strong>never</strong> record, transmit, or inspect query payloads, document contents, patient/customer identifiers, collection names, or database addresses.
            </p>
          </div>

          {/* Section 3: Third-Party Dependencies */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">3. Third-Party Libraries & Security</h4>
            <p className="text-slate-300">
              MongoLens utilizes open-source web standards and verified client libraries (including `fflate`, `recharts`, and `@tanstack/react-virtual`). No third-party tracking scripts or advertising cookies are integrated.
            </p>
          </div>

          {/* Section 4: Contact & Inquiries */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-400" />
              <span>4. Questions & Privacy Inquiries</span>
            </h4>
            <p className="text-slate-300">
              If you have any questions about this Privacy Policy or data security in MongoLens, please reach out to us directly at:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-between">
              <span className="font-mono text-brand-300 font-semibold">support.mongolens@gmail.com</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setContactOpen(true);
                }}
                className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
              >
                Open Contact Form →
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#090d16] border-t border-white/10 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};
