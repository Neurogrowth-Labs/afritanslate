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
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 h-full overflow-y-auto">
      <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">
        Cultural Intelligence
      </h3>
      
      {/* Risk Score */}
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Risk Score</span>
          <span className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
            {riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>
      
      {/* Tone Analysis */}
      {toneAnalysis && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Tone Analysis</h4>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
            {toneAnalysis}
          </p>
        </div>
      )}
      
      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Risk Alerts</h4>
          <div className="space-y-2">
            {riskFlags.map((flag, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${getSeverityColor(flag.severity)}`}
              >
                <p className="font-medium text-sm">"{flag.phrase}"</p>
                <p className="text-xs mt-1">{flag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cultural Notes */}
      {culturalNotes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Cultural Notes</h4>
          <ul className="space-y-2">
            {culturalNotes.map((note, index) => (
              <li key={index} className="text-sm text-gray-600 bg-green-50 p-2 rounded-md border border-green-200">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Empty State */}
      {riskFlags.length === 0 && culturalNotes.length === 0 && !toneAnalysis && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">Cultural insights will appear here after translation</p>
        </div>
      )}
    </div>
  );
};

export default CulturalInsightsPanel;
