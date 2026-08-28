import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { FileText, X, Scale, AlertCircle, Mail } from 'lucide-react';

export const TermsModal: React.FC = () => {
  const isOpen = useLogStore((state) => state.isTermsOpen);
  const setIsOpen = useLogStore((state) => state.setTermsOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-2xl bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Terms & Conditions</h3>
              <p className="text-[11px] text-slate-400">Last Updated: August 27, 2026</p>
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
          {/* Agreement Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 flex items-start gap-3">
            <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-slate-300">
              By accessing or using <strong>MongoLens</strong> (the "Application"), you agree to be bound by these Terms and Conditions. If you disagree with any portion of these terms, please discontinue use of the Application.
            </p>
          </div>

          {/* Section 1: Use of Service */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">1. Permitted Developer & DBA Use</h4>
            <p className="text-slate-300">
              MongoLens provides diagnostic visualization, slow query analysis, timeline correlation, and index recommendation utilities for MongoDB log archives. You may use this tool for personal, team, research, or enterprise database optimization.
            </p>
          </div>

          {/* Section 2: Recommendations & Heuristics Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>2. Diagnostic Heuristics & Index Suggestions Disclaimer</span>
            </h4>
            <p className="text-slate-300">
              All automated recommendations (including Equality-Sort-Range index proposals, COLLSCAN flags, and memory warnings) are generated as diagnostic guidance based on standard MongoDB best practices. Database Administrators (DBAs) and developers remain solely responsible for validating indexes, testing impacts in staging environments, and monitoring write overhead before applying changes to production clusters.
            </p>
          </div>

          {/* Section 3: "AS-IS" Warranty Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">3. Warranty Disclaimer</h4>
            <p className="text-slate-300">
              The Application is provided strictly on an <em>"AS IS"</em> and <em>"AS AVAILABLE"</em> basis without warranties of any kind, whether express, implied, or statutory, including without limitation warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </div>

          {/* Section 4: Limitation of Liability */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">4. Limitation of Liability</h4>
            <p className="text-slate-300">
              In no event shall the authors or maintainers of MongoLens be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use this Application.
            </p>
          </div>

          {/* Section 5: Contact */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-brand-400" />
              <span>5. Support and Inquiries</span>
            </h4>
            <p className="text-slate-300">
              For any questions, legal feedback, or support inquiries regarding these terms, please contact us at:
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
                Contact Support →
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
            Accept & Close
          </button>
        </div>
      </div>
    </div>
  );
};
