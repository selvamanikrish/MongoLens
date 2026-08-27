import React, { useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Mail, X, Copy, Check, Send, MessageSquare, Bug, Sparkles, HelpCircle } from 'lucide-react';

export const ContactModal: React.FC = () => {
  const isOpen = useLogStore((state) => state.isContactOpen);
  const setIsOpen = useLogStore((state) => state.setContactOpen);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('General Support & Feedback');
  const [message, setMessage] = useState('');

  const email = 'support.mongolens@gmail.com';

  if (!isOpen) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      `[MongoLens] ${subject}`
    )}&body=${encodeURIComponent(message || 'Hi MongoLens Support Team,\n\n')}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Contact MongoLens Support</h3>
              <p className="text-[11px] text-slate-400">Get technical assistance or suggest features</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Email Address Highlight Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                Official Support Email
              </span>
              <a
                href={`mailto:${email}`}
                className="font-mono text-xs sm:text-sm font-semibold text-brand-300 hover:underline"
              >
                {email}
              </a>
            </div>
            <button
              onClick={copyEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors shrink-0 font-mono text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Preset Topics */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Topic or Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Bug Report', icon: Bug, topic: 'Bug Report / Parsing Issue' },
                { label: 'Feature Request', icon: Sparkles, topic: 'Feature Request & Ideas' },
                { label: 'Slow Query Question', icon: MessageSquare, topic: 'Query Plan & Index Question' },
                { label: 'General Inquiry', icon: HelpCircle, topic: 'General Inquiry & Feedback' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = subject === item.topic;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSubject(item.topic)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-[11px] truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Message Box */}
          <form onSubmit={handleSendEmail} className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Message or Details (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you encountered or how we can help..."
                rows={4}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-slate-200 font-sans text-xs focus:outline-none focus:border-brand-500 placeholder-slate-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-glow-brand transition-all active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via Email Client</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#090d16] border-t border-white/5 text-center text-[11px] text-slate-500">
          MongoLens is privacy-first. We never ask for or collect your database credentials or private log files.
        </div>
      </div>
    </div>
  );
};
