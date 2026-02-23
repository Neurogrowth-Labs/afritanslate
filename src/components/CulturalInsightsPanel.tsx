import React from 'react';

interface RiskFlag {
  phrase: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

interface CulturalInsightsPanelProps {
  riskScore: number;
  toneAnalysis: string;
  culturalNotes: string[];
  riskFlags: RiskFlag[];
}

const CulturalInsightsPanel: React.FC<CulturalInsightsPanelProps> = ({
  riskScore,
  toneAnalysis,
  culturalNotes,
  riskFlags,
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/5 text-text-secondary border-white/10';
    }
  };
  
  return (
    <div className="space-y-4 p-4 bg-bg-surface rounded-lg border border-white/10 h-full overflow-y-auto shadow-xl">
      <h3 className="font-semibold text-white text-lg border-b border-white/10 pb-2">
        Cultural Intelligence
      </h3>
      
      {/* Risk Score */}
      <div className="bg-white/5 p-3 rounded-md border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-secondary">Risk Score</span>
          <span className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
            {riskScore}/100
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>
      
      {/* Tone Analysis */}
      {toneAnalysis && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider text-[10px]">Tone Analysis</h4>
          <p className="text-sm text-text-secondary bg-bg-surface p-3 rounded-md border border-white/10">
            {toneAnalysis}
          </p>
        </div>
      )}
      
      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider text-[10px]">⚠️ Risk Alerts</h4>
          <div className="space-y-2">
            {riskFlags.map((flag, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${getSeverityColor(flag.severity)} transition-all`}
              >
                <p className="font-bold text-sm">"{flag.phrase}"</p>
                <p className="text-xs mt-1 opacity-90">{flag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cultural Notes */}
      {culturalNotes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider text-[10px]">💡 Cultural Notes</h4>
          <ul className="space-y-2">
            {culturalNotes.map((note, index) => (
              <li key={index} className="text-sm text-text-secondary bg-bg-surface p-3 rounded-md border border-white/10">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Empty State */}
      {riskFlags.length === 0 && culturalNotes.length === 0 && !toneAnalysis && (
        <div className="text-center text-text-secondary py-12 flex flex-col items-center justify-center opacity-50">
          <p className="text-2xl mb-2">🧭</p>
          <p className="text-sm">Cultural insights will appear here after translation</p>
        </div>
      )}
    </div>
  );
};

export default CulturalInsightsPanel;
