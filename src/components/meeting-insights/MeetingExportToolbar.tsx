import React, { useState } from 'react';
import type { MeetingExportRecord } from '../../types';
import { getExportDownloadUrl } from '../../services/meetingInsightsClient';

interface Props {
  jobId: string;
  exports: MeetingExportRecord[];
}

const FORMAT_META = {
  txt: { label: 'TXT', icon: '📄', mime: 'text/plain' },
  srt: { label: 'SRT', icon: '💬', mime: 'text/plain' },
  pdf: { label: 'PDF', icon: '📕', mime: 'application/pdf' },
  docx: { label: 'DOCX', icon: '📝', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

export default function MeetingExportToolbar({ jobId, exports }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const getExport = (format: string) =>
    exports.find((e) => e.format === format);

  const handleDownload = async (record: MeetingExportRecord) => {
    if (!record.fileName) return;
    setDownloading(record.format);
    try {
      // F-3: ask the server to mint a signed URL after asserting the caller
      // owns this job. We no longer hit Supabase Storage `/sign` directly
      // with the public anon key.
      const { signedUrl, fileName } = await getExportDownloadUrl(jobId, record.format);
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = fileName ?? record.fileName;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="export-toolbar">
      <span className="export-label">Export:</span>
      {(Object.keys(FORMAT_META) as Array<keyof typeof FORMAT_META>).map((fmt) => {
        const record = getExport(fmt);
        const meta = FORMAT_META[fmt];
        const isReady = !!record;
        const isLoading = downloading === fmt;
        return (
          <button
            key={fmt}
            className={`export-btn ${isReady ? 'ready' : 'pending'}`}
            disabled={!isReady || !!downloading}
            onClick={() => record && handleDownload(record)}
            title={isReady ? `Download ${meta.label}` : `${meta.label} not yet available`}
          >
            {isLoading ? '⏳' : meta.icon} {meta.label}
          </button>
        );
      })}
    </div>
  );
}
