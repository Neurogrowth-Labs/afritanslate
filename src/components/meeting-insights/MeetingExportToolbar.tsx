import React, { useState } from 'react';
import type { MeetingExportRecord } from '../../types';

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
    if (!record.bucket || !record.path || !record.fileName) return;
    setDownloading(record.format);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(
        `${supabaseUrl}/storage/v1/object/sign/${record.bucket}/${record.path}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ expiresIn: 300 }),
        }
      );
      const { signedURL } = await res.json();
      const a = document.createElement('a');
      a.href = signedURL;
      a.download = record.fileName;
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
