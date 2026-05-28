import React, { useMemo } from 'react';
import { 
  Zap, 
  ArrowRight, 
  ShieldAlert, 
  Server, 
  Database, 
  Globe, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

const ASSET_ICONS = {
  application: <Server size={16} />,
  database: <Database size={16} />,
  infrastructure: <Zap size={16} />,
  network: <Globe size={16} />,
  default: <ShieldAlert size={16} />,
};

function DependencyNode({ asset, assets, depth = 0 }) {
  const maxDepth = 2;
  const hasChildren = (asset.dependencies || []).length > 0 && depth < maxDepth;

  return (
    <div className="flex flex-col">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cs-cyan-500 transition-colors flex items-center gap-3">
        <div className="p-2 bg-cs-light dark:bg-slate-700 rounded-lg text-cs-navy dark:text-cs-cyan-400">
          {ASSET_ICONS[asset.type] || ASSET_ICONS.default}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 dark:text-white text-sm">{asset.name}</div>
          <div className="text-xs text-slate-500 capitalize">{asset.type}</div>
        </div>
        {asset.findings && (
          <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            {asset.findings.length}
          </span>
        )}
      </div>

      {hasChildren && (
        <div className="ml-6 mt-3 pl-3 border-l-2 border-slate-300 dark:border-slate-600 flex flex-col gap-3">
          {(asset.dependencies || []).map(depId => {
            const depAsset = assets.find(a => a.id === depId) || { id: depId, name: depId, type: 'other' };
            return (
              <DependencyNode
                key={depId}
                asset={depAsset}
                assets={assets}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BlastRadiusView() {
  const { store } = useStore();
  const { findings, assets } = store;

  const atRiskAssets = useMemo(() => {
    const riskMap = new Map();
    findings.forEach(f => {
      if (f.severity === 'Critical' || f.severity === 'High') {
        const asset = assets.find(a => a.id === f.asset_id) || { id: f.asset_id, name: f.asset_name, type: 'other' };
        const current = riskMap.get(asset.id || f.asset_name) || { ...asset, findings: [] };
        current.findings.push(f);
        riskMap.set(asset.id || f.asset_name, current);
      }
    });
    return Array.from(riskMap.values());
  }, [findings, assets]);

  return (
    <div className="p-8 h-full flex flex-col gap-8 bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blast Radius Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400">Visualizing cascading risk and asset dependencies.</p>
        </div>
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold">
          <AlertTriangle size={16} />
          {atRiskAssets.length} High-Risk Nodes
        </div>
      </div>

      {atRiskAssets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Zap size={48} className="mb-4 opacity-20" />
          <p>No critical blast radius detected in the current dataset.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dependency Hierarchy (Multi-Level)</h3>
            <div className="space-y-6">
              {atRiskAssets.map((asset, idx) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                      {ASSET_ICONS[asset.type] || ASSET_ICONS.default}
                    </div>
                    {asset.name}
                    <span className="ml-auto text-xs font-bold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                      {asset.findings.length} Issues
                    </span>
                  </h4>
                  <div className="ml-2 space-y-3">
                    <DependencyNode asset={asset} assets={assets} depth={0} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-fit sticky top-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Impact Summary</h3>
            <div className="flex flex-col justify-center space-y-6">
              <div className="text-center p-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600">
                <Zap size={48} className="mx-auto mb-4 text-cs-navy dark:text-cs-cyan-400 opacity-50" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  This view maps how a failure in <span className="font-bold text-slate-700 dark:text-slate-200">Root Asset A</span> affects <span className="font-bold text-slate-700 dark:text-slate-200">Child Asset B</span>.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <div className="px-3 py-1 bg-red-500 text-white text-[10px] rounded-full font-bold">Tiers 1-2: Critical Impact</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{atRiskAssets.length}</div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Blast Origins</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {atRiskAssets.reduce((sum, a) => sum + ((a.dependencies || []).length), 0)}
                  </div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Risked Nodes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
