import React, { useState, useMemo } from 'react';
import { CapaWorkflow } from '../types/capa';
import { ActiveCapaList } from './ActiveCapaList';
import { CapaHistoryList } from './CapaHistoryList';
import { CapaDetailPanel } from './CapaDetailPanel';

interface CapaAndMonitoringTabProps {
  capas: CapaWorkflow[];
  onCreateCapa: (capa: CapaWorkflow) => void;
  onUpdateCapa: (id: string, updates: Partial<CapaWorkflow>) => void;
  onCloseCapa: (id: string) => void;
}

export const CapaAndMonitoringTab: React.FC<CapaAndMonitoringTabProps> = ({
  capas,
  onCreateCapa,
  onUpdateCapa,
  onCloseCapa,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'monitoring'>('active');
  const [selectedCapaId, setSelectedCapaId] = useState<string | null>(null);

  // Filter CAPAs into active and closed
  const activeCapas = useMemo(
    () => capas.filter((c) => c.status !== 'closed'),
    [capas]
  );

  const closedCapas = useMemo(
    () => capas.filter((c) => c.status === 'closed'),
    [capas]
  );

  // Get selected CAPA object
  const selectedCapa = useMemo(
    () => {
      if (!selectedCapaId) return null;
      return capas.find((c) => c.id === selectedCapaId) || null;
    },
    [selectedCapaId, capas]
  );

  // Handle CAPA selection from lists
  const handleSelectCapa = (capa: CapaWorkflow) => {
    setSelectedCapaId(capa.id);
  };

  // Handle save from detail panel
  const handleSave = (capa: CapaWorkflow) => {
    onUpdateCapa(capa.id, capa);
  };

  // Handle close from detail panel
  const handleCloseFromPanel = (capaId: string) => {
    onCloseCapa(capaId);
    setSelectedCapaId(null);
  };

  const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-medium transition-colors border-b-2 ${
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-2">
          <TabButton
            label="Active CAPA Workflows"
            isActive={activeTab === 'active'}
            onClick={() => {
              setActiveTab('active');
              setSelectedCapaId(null);
            }}
          />
          <TabButton
            label="CAPA History"
            isActive={activeTab === 'history'}
            onClick={() => {
              setActiveTab('history');
              setSelectedCapaId(null);
            }}
          />
          <TabButton
            label="Continuous Monitoring"
            isActive={activeTab === 'monitoring'}
            onClick={() => {
              setActiveTab('monitoring');
              setSelectedCapaId(null);
            }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Active Tab */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active CAPA List */}
            <div className="min-h-0">
              {activeCapas.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  No active CAPA workflows at this time
                </div>
              ) : (
                <ActiveCapaList
                  capas={activeCapas}
                  onSelectCapa={handleSelectCapa}
                />
              )}
            </div>

            {/* Right: Detail Panel */}
            {selectedCapa && (
              <div className="min-h-0 overflow-auto">
                <CapaDetailPanel
                  capa={selectedCapa}
                  onSave={handleSave}
                  onClose={handleCloseFromPanel}
                  readonly={false}
                />
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: History List */}
            <div className="min-h-0">
              {closedCapas.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  No closed CAPA records found
                </div>
              ) : (
                <CapaHistoryList
                  closedCapas={closedCapas}
                  onSelectCapa={handleSelectCapa}
                />
              )}
            </div>

            {/* Right: Detail Panel (Readonly) */}
            {selectedCapa && selectedCapa.status === 'closed' && (
              <div className="min-h-0 overflow-auto">
                <CapaDetailPanel
                  capa={selectedCapa}
                  onSave={handleSave}
                  onClose={handleCloseFromPanel}
                  readonly={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold dark:text-white mb-2">
              Continuous Monitoring Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Continuous Monitoring dashboard coming in Phase 6B
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
