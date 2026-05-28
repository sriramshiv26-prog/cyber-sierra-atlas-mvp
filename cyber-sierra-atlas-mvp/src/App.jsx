import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './hooks/useStore';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { DashboardView } from './components/DashboardView';
import { RegisterView } from './components/RegisterView';
import { BlastRadiusView } from './components/BlastRadiusView';
import { CrosswalkView } from './components/CrosswalkView';
import { GenealogyView } from './components/GenealogyView';
import { ReportsView } from './components/ReportsView';
import { FileUploadModal } from './components/FileUploadModal';
import { SmartIngestPreview } from './components/SmartIngestPreview';

function AppContent() {
  const { store, dispatch } = useStore();
  const [view, setView] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('fr.theme') || 'light');
  const [density, setDensity] = useState(() => localStorage.getItem('fr.density') || 'cosy');

  // Ingest State Machine
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingFindings, setPendingFindings] = useState(null);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('fr.theme', theme);
    document.body.className = theme === 'dark' ? 'dark' : '';
  }, [theme]);

  // Persist density
  useEffect(() => {
    localStorage.setItem('fr.density', density);
    document.body.setAttribute('data-density', density);
  }, [density]);

  const viewMap = {
    dashboard: <DashboardView />,
    register: <RegisterView />,
    blast: <BlastRadiusView />,
    crosswalk: <CrosswalkView />,
    genealogy: <GenealogyView />,
    reports: <ReportsView />,
  };

  // Handle the final commit from Smard Ingest
  const handleCommitFindings = (finalFindings) => {
    dispatch({ type: 'ADD_FINDINGS', payload: finalFindings });
    setPendingFindings(null);
    setView('register'); // Jump to register to see the results
  };

  return (
    <div className="flex flex-col h-screen bg-cs-light dark:bg-slate-900 overflow-hidden">
      <Header 
        view={view} 
        onViewChange={setView}
        theme={theme}
        onThemeChange={setTheme}
        density={density}
        onDensityChange={setDensity}
        lastSaved={store.lastSaved}
      />
      <TabNav view={view} onViewChange={setView} />
      
      <main className="flex-1 overflow-y-auto relative">
        {viewMap[view]}
      </main>

      {/* Global Ingest Modals */}
      <FileUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onParsedFindings={(findings) => {
          setPendingFindings(findings);
          setIsUploadOpen(false);
        }}
      />

      {pendingFindings && (
        <SmartIngestPreview 
          findings={pendingFindings}
          onCancel={() => setPendingFindings(null)}
          onApprove={handleCommitFindings}
        />
      )}

      {/* Floating Action Button for Upload */}
      <button 
        onClick={() => setIsUploadOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-cs-navy dark:bg-cs-cyan-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-40 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">+</span>
        <span className="hidden md:inline">Import Findings</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
