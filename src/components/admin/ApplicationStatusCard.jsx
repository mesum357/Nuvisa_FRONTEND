import { useMemo, useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { formatApplicationId } from '@/utils/idFormat';
import { saveOrderId } from '@/utils/adminStorage';

export default function ApplicationStatusCard({ application, onSelect }) {
  const [open, setOpen] = useState(false);
  const rawAppId = application?.id ?? application?.applicationId ?? application?.code;
  const rawOrderId = application?.orderId ?? application?.order_id ?? application?.orderCode;
  const appId = useMemo(() => formatApplicationId(rawAppId), [rawAppId]);

  const onClickView = () => {
    if (rawOrderId) saveOrderId(rawOrderId);
    onSelect?.(application);
  };


  return (
    <div className="bg-[#2A1B3D]/50 border border-[#423577] rounded-lg p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{application?.country || application?.countryName || '—'}</p>
            <p className="text-white/60 text-xs mt-1">Application: {appId} • Order: {rawOrderId ?? "-"}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={application?.applicationStatus || application?.status} />
            <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
      {open && (
        <div className="mt-3 border-t border-[#423577] pt-3 text-sm text-white/80 space-y-1">
          <Row label="Email" value={application?.email} />
          {application?.createdAt && (
            <Row label="Created" value={new Date(application.createdAt).toLocaleString()} />
          )}
          <div className="pt-2">
            <button onClick={onClickView} className="text-xs py-2 px-3 bg-[#7350FF] hover:bg-[#6247D3] text-white rounded flex items-center gap-1">
              <Eye size={12} /> Open in application-step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const norm = String(status || 'pending').replace(/_/g, ' ').toLowerCase();
  const color =
    norm.includes('approved') || norm.includes('complete')
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-700/40'
      : norm.includes('reject') || norm.includes('fail')
        ? 'bg-rose-500/20 text-rose-300 border-rose-700/40'
        : 'bg-amber-500/10 text-amber-300 border-amber-700/30';
  return (
    <span className={`px-2 py-1 rounded text-xs border ${color}`}>
      {norm.toUpperCase()}
    </span>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/60">{label}</span>
      <span className="text-white">{String(value)}</span>
    </div>
  );
}
