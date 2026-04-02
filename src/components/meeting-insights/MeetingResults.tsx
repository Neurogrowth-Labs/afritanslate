import React from 'react';
import type { MeetingInsightsResult } from '../../types';

interface Props {
  result: MeetingInsightsResult;
}

export default function MeetingResults({ result }: Props) {
  return (
    <div className="meeting-results">

      <section className="results-section">
        <h3 className="results-heading">📋 Executive Summary</h3>
        <p className="results-summary">{result.executiveSummary}</p>
      </section>

      {result.keyPoints.length > 0 && (
        <section className="results-section">
          <h3 className="results-heading">🔑 Key Discussion Points</h3>
          <ul className="results-list">
            {result.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      {result.decisions.length > 0 && (
        <section className="results-section">
          <h3 className="results-heading">✅ Decisions Made</h3>
          <ul className="results-list decisions-list">
            {result.decisions.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </section>
      )}

      {result.actionItems.length > 0 && (
        <section className="results-section">
          <h3 className="results-heading">📌 Action Items</h3>
          <ul className="results-list action-list">
            {result.actionItems.map((a, i) => (
              <li key={i} className="action-item">
                <span className="action-desc">{a.description}</span>
                {a.assignedSpeaker && (
                  <span className="action-owner">👤 {a.assignedSpeaker}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.highlights.length > 0 && (
        <section className="results-section">
          <h3 className="results-heading">⭐ Highlights</h3>
          <ul className="results-list highlights-list">
            {result.highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </section>
      )}

      <section className="results-section language-note">
        <h3 className="results-heading">🌍 Language Note</h3>
        <div className="lang-note-grid">
          <div><span className="lang-label">Original:</span> {result.languageNote.originalLanguages.join(', ').toUpperCase()}</div>
          <div><span className="lang-label">Output:</span> {result.languageNote.outputLanguage.toUpperCase()}</div>
          <div><span className="lang-label">Localization:</span> {result.languageNote.localizationLevel === 'deep_localized' ? 'Deep Localized' : 'Direct Translation'}</div>
        </div>
      </section>
    </div>
  );
}
