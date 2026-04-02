import React from 'react';
import type { MeetingJobStatus } from '../../types';

interface Props {
  status: MeetingJobStatus;
  stage: string | null;
  progress: number;
  errorCode: string | null;
  errorMessage: string | null;
  onRetry: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued — waiting to start',
  uploading: 'Uploading recording...',
  transcribing: 'Transcribing audio...',
  localizing: 'Localizing transcript...',
  extracting_insights: 'Extracting insights...',
  saving_results: 'Saving results...',
  exporting: 'Finalizing...',
  completed: 'Complete',
};

const STATUS_ICONS: Record<MeetingJobStatus, string> = {
  queued: '⏳',
  uploading: '📤',
  transcribing: '🎙️',
  localizing: '🌍',
  extracting_insights: '🧠',
  exporting: '📦',
  succeeded: '✅',
  failed: '❌',
};

export default function MeetingJobStatus({ status, stage, progress, errorCode, errorMessage, onRetry }: Props) {
  const icon = STATUS_ICONS[status] ?? '⏳';
  const stageLabel = STAGE_LABELS[stage ?? status] ?? stage ?? status;
  const isActive = !['succeeded', 'failed'].includes(status);

  return (
    <div className={`job-status-panel status-${status}`}>
      <div className="status-header">
        <span className="status-icon">{icon}</span>
        <span className="status-label">{stageLabel}</span>
        {isActive && <span className="status-spinner" />}
      </div>

      {isActive && (
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="progress-pct">{progress}%</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="error-panel">
          <p className="error-code">Error: {errorCode ?? 'unknown_error'}</p>
          <p className="error-message">{errorMessage ?? 'An unexpected error occurred.'}</p>
          {errorCode === 'missing_audio' && (
            <p className="error-hint">
              💡 Tip: Make sure you uploaded a valid audio or video file, or that your meeting link contains an accessible recording.
            </p>
          )}
          <button className="retry-btn" onClick={onRetry}>
            🔄 Try Again
          </button>
        </div>
      )}
    </div>
  );
}
