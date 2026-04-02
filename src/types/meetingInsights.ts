export type MeetingSourceType = 'recording_upload' | 'meeting_link';

export type TranscriptionStyle = 'verbatim' | 'clean_read' | 'executive_summary';

export type LocalizationMode = 'direct_translation' | 'deep_localized';

export type MeetingJobStatus =
  | 'queued'
  | 'uploading'
  | 'transcribing'
  | 'localizing'
  | 'extracting_insights'
  | 'exporting'
  | 'succeeded'
  | 'failed';

export interface TranscriptSegment {
  segmentIndex: number;
  startMs: number | null;
  endMs: number | null;
  speakerLabel: string | null;
  languageCode: string | null;
  originalText: string;
  localizedText: string | null;
  isInaudible: boolean;
  confidence: number | null;
}

export interface ActionItem {
  description: string;
  assignedSpeaker: string | null;
}

export interface LanguageNote {
  originalLanguages: string[];
  outputLanguage: string;
  localizationLevel: LocalizationMode;
}

export interface MeetingInsightsResult {
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  highlights: string[];
  executiveSummary: string;
  languageNote: LanguageNote;
}

export interface MeetingJob {
  id: string;
  userId: string;
  sourceType: MeetingSourceType;
  sourceUrl: string | null;
  recordingBucket: string | null;
  recordingPath: string | null;
  outputLanguageCode: string;
  transcriptionStyle: TranscriptionStyle;
  localizationMode: LocalizationMode;
  status: MeetingJobStatus;
  stage: string | null;
  progress: number;
  segments: TranscriptSegment[];
  result: MeetingInsightsResult | null;
  executiveSummary: string | null;
  languageNote: string | null;
  retryCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingSubmitRequest {
  sourceType: MeetingSourceType;
  sourceUrl?: string;
  outputLanguageCode: string;
  transcriptionStyle: TranscriptionStyle;
  localizationMode: LocalizationMode;
}

export interface MeetingExportRecord {
  id: string;
  jobId: string;
  format: 'txt' | 'srt' | 'pdf' | 'docx';
  bucket: string | null;
  path: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
