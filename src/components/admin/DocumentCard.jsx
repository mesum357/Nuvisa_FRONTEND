import { useState } from 'react';
import { Eye, ChevronDown, Download } from 'lucide-react';
import { saveTravelerId } from '@/utils/adminStorage';
import { formatApplicationId } from '@/utils/idFormat';

export default function DocumentCard({ document, onView }) {
  const [open, setOpen] = useState(false);
  const buildFilename = () => {
    const base = document?.name || document?.type || 'document';
    const app = document?.applicationId ? `_${formatApplicationId(document.applicationId)}` : '';
    return `${base}${app}`.replace(/\s+/g, '_');
  };

  const handleView = () => {
    if (document?.travelerId !== undefined) saveTravelerId(document.travelerId);
    if (onView) {
      onView(document);
      return;
    }
    if (typeof window !== 'undefined') {
      const target = document?.previewUrl || document?.downloadUrl;
      if (target) {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleDownload = (e) => {
    e?.preventDefault?.();
    if (typeof window === 'undefined') return;
    const href = document?.downloadUrl || document?.previewUrl;
    if (!href) return;
    const filename = buildFilename();

    const a = (typeof window !== 'undefined' && window.document?.createElement)
      ? window.document.createElement('a')
      : null;
    if (a) {
      a.href = href;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      window.document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-[#1A0F2E] border border-[#423577] rounded p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm">{document?.name || 'Document'}</p>
            <p className="text-white/60 text-xs mt-1">{document?.type || 'type'} • {document?.status || 'pending'}</p>
          </div>
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="pt-3 space-y-2 text-white/80 text-sm">
          {document?.previewUrl ? (
            <div className="rounded border border-[#423577] overflow-hidden bg-black/20">
              <img src={document.previewUrl} alt={document?.name || 'Document preview'} className="w-full max-h-64 object-contain" />
            </div>
          ) : (
            <div className="text-white/50">No preview available</div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {document?.applicationId && (
                <div>
                  Application ID: <span className="text-white">{formatApplicationId(document.applicationId)}</span>
                </div>
              )}
              {document?.size && <div>Size: <span className="text-white">{document.size}</span></div>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleView} className="text-xs py-1 px-2 bg-[#7350FF] hover:bg-[#6247D3] text-white rounded flex items-center gap-1">
                <Eye size={12} /> View
              </button>
              {(document?.downloadUrl || document?.previewUrl) && (
                <button onClick={handleDownload} className="text-xs py-1 px-2 border border-[#423577] text-white/80 rounded flex items-center gap-1">
                  <Download size={12} /> Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
