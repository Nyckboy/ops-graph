import React from 'react';
import { Server, Database, AppWindow, ShieldAlert, Activity, User, Users } from 'lucide-react';

const Sidebar = ({ 
  selectedNode, 
  impactReport, 
  isLoading, 
  isHealing, 
  viewMode, 
  setViewMode, 
  onReset, 
  onHeal, 
  onAudit 
}) => {
  if (!selectedNode) return null;

  const nodeLabel = selectedNode.label;
  const nodeName = selectedNode.realName || selectedNode.name;

  return (
    <div className="absolute top-6 right-6 w-96 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl z-20 transition-all">
      
      {/* 1. VIEW MODE TOGGLE */}
      <div className="mb-6 flex gap-2 border-b border-gray-700 pb-4">
          <button 
            onClick={() => setViewMode('OPS')}
            className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${viewMode === 'OPS' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            OPS VIEW
          </button>
          <button 
            onClick={() => setViewMode('SEC')}
            className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${viewMode === 'SEC' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            SEC VIEW
          </button>
      </div>

      {/* 2. NODE HEADER */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        {nodeLabel === "Server" && <Server className="text-blue-400" size={28} />}
        {nodeLabel === "Database" && <Database className="text-yellow-400" size={28} />}
        {nodeLabel === "App" && <AppWindow className="text-green-400" size={28} />}
        {nodeLabel === "User" && <User className="text-pink-400" size={28} />}
        {nodeLabel === "Group" && <Users className="text-purple-400" size={28} />}
        
        <div>
          <h2 className="text-xl font-bold text-white break-words">{nodeName}</h2>
          <span className="text-xs uppercase tracking-wider text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
            {nodeLabel}
          </span>
        </div>
      </div>

      {/* 3. PROPERTIES LIST */}
      <div className="space-y-2 text-sm text-gray-300 mb-6">
        {selectedNode.status && (
            <div className="flex justify-between">
            <span>Status:</span>
            <span className={selectedNode.status === "risk" ? "text-red-400 font-bold" : "text-green-400"}>
                {selectedNode.status}
            </span>
            </div>
        )}
        {selectedNode.role && (
          <div className="flex justify-between">
            <span>Role:</span>
            <span className="font-mono text-gray-400">{selectedNode.role}</span>
          </div>
        )}
        {selectedNode.ip && (
          <div className="flex justify-between">
            <span>IP:</span>
            <span className="font-mono text-gray-400">{selectedNode.ip}</span>
          </div>
        )}
      </div>

      {/* 4. SECURITY AUDIT PANEL (Only for Users in SEC Mode) */}
      {nodeLabel === 'User' && viewMode === 'SEC' && (
          <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
            <h3 className="text-purple-300 text-sm font-bold mb-3 flex items-center gap-2">
                👮 Security Audit
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Trace all access paths from this user to critical infrastructure.
            </p>
            
            {isLoading ? (
               <div className="flex items-center justify-center gap-2 text-purple-400 py-2">
                 <Activity className="animate-spin" size={16} /> TRACING...
               </div>
            ) : (
                <button
                onClick={() => onAudit(nodeName)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded text-xs font-bold transition-all shadow-lg shadow-purple-900/50"
                >
                RUN ACCESS TRACE
                </button>
            )}
          </div>
      )}

      {/* 5. OPS IMPACT PANEL (Only for Servers) */}
      {nodeLabel === "Server" && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="flex items-center gap-2 text-red-400 font-bold mb-3">
            <ShieldAlert size={18} /> Impact Simulation
          </h3>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 animate-pulse py-4">
              <Activity size={16} /> Analyzing dependencies...
            </div>
          ) : impactReport ? (
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Total Affected: <span className="text-red-400 font-bold">{impactReport.total_affected}</span>
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar mb-4 bg-gray-900/30 p-2 rounded">
                {impactReport.services.map((s, i) => (
                  <li key={i} className="text-xs flex items-center gap-2 text-red-300 px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {s.name}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={onHeal} 
                disabled={isHealing} 
                className={`w-full py-2 rounded font-bold text-sm mb-2 transition-all flex items-center justify-center gap-2
                    ${isHealing ? "bg-green-900/50 text-green-400 border border-green-500 cursor-not-allowed" : "bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50"}`}
              >
                {isHealing ? <><Activity size={14} className="animate-spin"/> REPAIRING...</> : "INITIATE REPAIR"}
              </button>
              
              <button onClick={onReset} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded border border-gray-600 text-xs transition-colors">
                Clear Simulation
              </button>
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm py-2">
              System Nominal. No simulations active.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
