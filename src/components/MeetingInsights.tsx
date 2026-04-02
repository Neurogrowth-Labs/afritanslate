import React, { useState, useCallback, useRef } from 'react';
import MeetingSubmissionForm from './meeting-insights/MeetingSubmissionForm';
import MeetingJobStatus from './meeting-insights/MeetingJobStatus';
import MeetingTranscript from './meeting-insights/MeetingTranscript';
import MeetingResults from './meeting-insights/MeetingResults';
import MeetingExportToolbar from './meeting-insights/MeetingExportToolbar';
import {
  submitMeetingJob,
  getUploadUrl,
  uploadRecording,
  waitForJob,
} from '../services/meetingInsightsClient';
import type { MeetingJob, MeetingSubmitRequest, TranscriptSegment, MeetingExportRecord, MeetingInsightsResult } from '../types';

type View = 'form' | 'processing' | 'results';

export default function MeetingInsights() {
  const [view, setView] = useState<View>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<MeetingJob | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [exports, setExports] = useState<MeetingExportRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'transcript'>('insights');
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (request: MeetingSubmitRequest, file?: File) => {
    setIsSubmitting(true);
    try {
      // 1. Create the job
      const { jobId } = await submitMeetingJob(request);

      // 2. If upload, get signed URL and push the file
      if (request.sourceType === 'recording_upload' && file) {
        const { signedUrl } = await getUploadUrl(jobId, file.name, file.type);
        await uploadRecording(signedUrl, file);
      }

      setView('processing');

      // 3. Poll until terminal status
      abortRef.current = new AbortController();
      await waitForJob(
        jobId,
        (result) => {
          setJob(result.job);
          setSegments(result.segments);
          setExports(result.exports);
          if (result.job.status === 'succeeded') {
            setView('results');
          }
        },
        abortRef.current.signal
      );
    } catch (err) {
      console.error('Meeting submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    abortRef.current?.abort();
    setJob(null);
    setSegments([]);
    setExports([]);
    setView('form');
  }, []);

  const result = job?.result as MeetingInsightsResult | null;

  return (
    <div className="meeting-insights-shell">
      <div className="meeting-insights-header">
        <h2 className="meeting-insights-title">
          🎙️ Meeting Insights
        </h2>
        <p className="meeting-insights-subtitle">
          Transcribe, localize, and extract intelligence from your meetings
        </p>
        {view !== 'form' && (
          <button className="new-meeting-btn" onClick={handleRetry}>
            + New Meeting
          </button>
        )}
      </div>

      {view === 'form' && (
        <MeetingSubmissionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      )}

      {view === 'processing' && job && (
        <MeetingJobStatus
          status={job.status}
          stage={job.stage}
          progress={job.progress}
          errorCode={job.errorCode}
          errorMessage={job.errorMessage}
          onRetry={handleRetry}
        />
      )}

      {view === 'results' && job && result && (
        <div className="results-shell">
          <MeetingExportToolbar jobId={job.id} exports={exports} />

          <div className="results-tabs">
            <button
              className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              🧠 Insights
            </button>
            <button
              className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              📝 Transcript
            </button>
          </div>

          {activeTab === 'insights' && <MeetingResults result={result} />}
          {activeTab === 'transcript' && <MeetingTranscript segments={segments} />}
        </div>
      )}
    </div>
  );
}
