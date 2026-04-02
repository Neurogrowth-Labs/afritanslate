import React, { useState } from 'react';
import type { TranscriptSegment } from '../../types';

interface Props {
  segments: TranscriptSegment[];
  showOriginal?: boolean;
}

function msToReadable(ms: number | null): string {
  if (ms == null) return '';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SPEAKER_COLORS = [
  '#01696f', '#437a22', '#006494', '#7a39bb',
  '#da7101', '#a12c7b', '#964219', '#a13544',
];

function getSpeakerColor(label: string | null): string {
  if (!label) return '#7a7974';
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return SPEAKER_COLORS[hash % SPEAKER_COLORS.length];
}

export default function MeetingTranscript({ segments, showOriginal = false }: Props) {
  const [viewOriginal, setViewOriginal] = useState(showOriginal);

  if (!segments.length) {
    return <p className="transcript-empty">No transcript segments available.</p>;
  }

  return (
    <div className="meeting-transcript">
      <div className="transcript-toolbar">
        <span className="transcript-count">{segments.length} segments</span>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={viewOriginal}
            onChange={(e) => setViewOriginal(e.target.checked)}
          />
          Show original language
        </label>
      </div>

      <div className="transcript-segments">
        {segments.map((s) => {
          const text = viewOriginal ? s.originalText : (s.localizedText ?? s.originalText);
          const color = getSpeakerColor(s.speakerLabel);
          return (
            <div
              key={s.segmentIndex}
              className={`segment ${s.isInaudible ? 'segment-inaudible' : ''}`}
            >
              <div className="segment-meta">
                {s.startMs != null && (
                  <span className="segment-time">{msToReadable(s.startMs)}</span>
                )}
                {s.speakerLabel && (
                  <span className="segment-speaker" style={{ color }}>
                    {s.speakerLabel}
                  </span>
                )}
                {s.languageCode && (
                  <span className="segment-lang">{s.languageCode.toUpperCase()}</span>
                )}
              </div>
              <p className={`segment-text ${s.isInaudible ? 'inaudible' : ''}`}>
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
