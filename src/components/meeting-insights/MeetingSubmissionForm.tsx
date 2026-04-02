import React, { useState, useRef } from 'react';
import type { MeetingSubmitRequest, MeetingSourceType, TranscriptionStyle, LocalizationMode } from '../../types';

interface Props {
  onSubmit: (request: MeetingSubmitRequest, file?: File) => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
  { code: 'zu', label: 'Zulu' },
  { code: 'xh', label: 'Xhosa' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'am', label: 'Amharic' },
  { code: 'so', label: 'Somali' },
];

export default function MeetingSubmissionForm({ onSubmit, isLoading }: Props) {
  const [sourceType, setSourceType] = useState<MeetingSourceType>('recording_upload');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [transcriptionStyle, setTranscriptionStyle] = useState<TranscriptionStyle>('clean_read');
  const [localizationMode, setLocalizationMode] = useState<LocalizationMode>('deep_localized');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: MeetingSubmitRequest = {
      sourceType,
      sourceUrl: sourceType === 'meeting_link' ? sourceUrl : undefined,
      outputLanguageCode: outputLanguage,
      transcriptionStyle,
      localizationMode,
    };
    onSubmit(request, file ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="meeting-submission-form">
      <div className="form-section">
        <label className="form-label">Source Type</label>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${sourceType === 'recording_upload' ? 'active' : ''}`}
            onClick={() => setSourceType('recording_upload')}
          >
            📁 Upload Recording
          </button>
          <button
            type="button"
            className={`toggle-btn ${sourceType === 'meeting_link' ? 'active' : ''}`}
            onClick={() => setSourceType('meeting_link')}
          >
            🔗 Meeting Link
          </button>
        </div>
      </div>

      {sourceType === 'recording_upload' ? (
        <div className="form-section">
          <label className="form-label">Recording File</label>
          <div
            className="file-drop-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files[0];
              if (dropped) setFile(dropped);
            }}
          >
            {file ? (
              <span className="file-name">✅ {file.name}</span>
            ) : (
              <span className="file-hint">Drag & drop or click to upload audio/video<br /><small>MP3, MP4, M4A, WAV, OGG, WEBM</small></span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="form-section">
          <label className="form-label">Meeting Link</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://zoom.us/rec/... or Google Meet recording URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-row">
        <div className="form-section">
          <label className="form-label">Output Language</label>
          <select
            className="form-select"
            value={outputLanguage}
            onChange={(e) => setOutputLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label className="form-label">Transcription Style</label>
          <select
            className="form-select"
            value={transcriptionStyle}
            onChange={(e) => setTranscriptionStyle(e.target.value as TranscriptionStyle)}
          >
            <option value="verbatim">Verbatim (word-for-word)</option>
            <option value="clean_read">Clean Read (edited for clarity)</option>
            <option value="executive_summary">Executive Summary</option>
          </select>
        </div>

        <div className="form-section">
          <label className="form-label">Localization Mode</label>
          <select
            className="form-select"
            value={localizationMode}
            onChange={(e) => setLocalizationMode(e.target.value as LocalizationMode)}
          >
            <option value="direct_translation">Direct Translation</option>
            <option value="deep_localized">Deep Localized (cultural adaptation)</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={isLoading || (sourceType === 'recording_upload' && !file) || (sourceType === 'meeting_link' && !sourceUrl)}
      >
        {isLoading ? '⏳ Processing...' : '🚀 Analyze Meeting'}
      </button>
    </form>
  );
}
