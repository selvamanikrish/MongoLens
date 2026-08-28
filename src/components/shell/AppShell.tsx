import React, { useEffect } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ExportModal } from './ExportModal';
import { QueryDetailDrawer } from '../drawer/QueryDetailDrawer';
import { FileDropzone } from '../landing/FileDropzone';

// Legal & Support Modals
import { TermsModal } from '../legal/TermsModal';
import { PrivacyModal } from '../legal/PrivacyModal';
import { ContactModal } from '../legal/ContactModal';

// Pages
import { OverviewPage } from '../pages/OverviewPage';
import { SlowQueriesPage } from '../pages/SlowQueriesPage';
import { OperationsPage } from '../pages/OperationsPage';
import { CollectionsPage } from '../pages/CollectionsPage';
import { ErrorsPage } from '../pages/ErrorsPage';
import { TimelinePage } from '../pages/TimelinePage';
import { RawLogsViewer } from '../pages/RawLogsViewer';

export const AppShell: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const isParsing = useLogStore((state) => state.isParsing);
  const activePage = useLogStore((state) => state.activePage);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const isMobileSidebarOpen = useLogStore((state) => state.isMobileSidebarOpen);
  const setMobileSidebarOpen = useLogStore((state) => state.setMobileSidebarOpen);
  const setCommandPaletteOpen = useLogStore((state) => state.setCommandPaletteOpen);
  const setShortcutsOpen = useLogStore((state) => state.setShortcutsOpen);
  const setDrawerOpen = useLogStore((state) => state.setDrawerOpen);
  const setTermsOpen = useLogStore((state) => state.setTermsOpen);
  const setPrivacyOpen = useLogStore((state) => state.setPrivacyOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);
  const clearData = useLogStore((state) => state.clearData);

  // Auto-close mobile sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileSidebarOpen]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    let pendingGKey = false;
    let gKeyTimeout: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // 1. Ctrl / Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // 2. Ctrl / Cmd + O -> Open file
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        clearData();
        return;
      }

      // 3. Escape -> Close drawer / modals / mobile sidebar
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setMobileSidebarOpen(false);
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setTermsOpen(false);
        setPrivacyOpen(false);
        setContactOpen(false);
        return;
      }

      // 4. Question Mark (?) -> Shortcuts Modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // 5. Sequence Shortcuts: "G" then "..."
      if (e.key.toLowerCase() === 'g' && !pendingGKey) {
        pendingGKey = true;
        clearTimeout(gKeyTimeout);
        gKeyTimeout = setTimeout(() => {
          pendingGKey = false;
        }, 1200);
        return;
      }

      if (pendingGKey) {
        pendingGKey = false;
        clearTimeout(gKeyTimeout);
        const k = e.key.toLowerCase();
        if (k === 'o') setActivePage('overview');
        else if (k === 's') setActivePage('slow-queries');
        else if (k === 'p') setActivePage('operations');
        else if (k === 'c') setActivePage('collections');
        else if (k === 'e') setActivePage('errors');
        else if (k === 't') setActivePage('timeline');
        else if (k === 'r') setActivePage('raw-logs');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gKeyTimeout);
    };
  }, [setActivePage, setCommandPaletteOpen, setShortcutsOpen, setDrawerOpen, setMobileSidebarOpen, setTermsOpen, setPrivacyOpen, setContactOpen, clearData]);

  // If no log is parsed or actively in initial upload state, render landing / dropzone
  if (!logResult || isParsing) {
    return (
      <>
        <FileDropzone />
        <TermsModal />
        <PrivacyModal />
        <ContactModal />
      </>
    );
  }

  // Render Dashboard Views
  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'slow-queries':
        return <SlowQueriesPage />;
      case 'operations':
        return <OperationsPage />;
      case 'collections':
        return <CollectionsPage />;
      case 'errors':
        return <ErrorsPage />;
      case 'timeline':
        return <TimelinePage />;
      case 'raw-logs':
        return <RawLogsViewer />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen bg-[#090d14] text-slate-100 font-sans overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Top Header */}
        <TopBar />

        {/* Dynamic View Container */}
        <main className="flex-1 pb-10">{renderActivePage()}</main>
      </div>

      {/* Slide-out Query Detail Drawer */}
      <QueryDetailDrawer />

      {/* Global Modals */}
      <CommandPalette />
      <KeyboardShortcutsModal />
      <ExportModal />
      <TermsModal />
      <PrivacyModal />
      <ContactModal />
    </div>
  );
};
