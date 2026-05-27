import { useState, useEffect, useCallback } from "react";
import {
  getApplicationActivity,
  getApplicationDetails,
  updateApplicationStatus,
  assignApplication,
  getTeamMembers,
} from "@/api/admin";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import axios from "axios";
import { getPublicApiBase } from "@/utils/adminApiBase";

const apiBase = () => getPublicApiBase() || process.env.NEXT_PUBLIC_API_URL || "";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const PROGRESS_STEPS = [
  { key: "submitted", label: "Submitted", pct: 20 },
  { key: "under_review", label: "Under review", pct: 40 },
  { key: "processing", label: "Processing", pct: 55 },
  { key: "appointment_booked", label: "Appointment", pct: 70 },
  { key: "at_embassy", label: "At embassy", pct: 85 },
  { key: "approved", label: "Approved", pct: 100 },
  { key: "completed", label: "Completed", pct: 100 },
];

const progressForStatus = (status) => {
  const s = String(status || "submitted").toLowerCase();
  const step = PROGRESS_STEPS.find((p) => s.includes(p.key.replace("_", "")) || s === p.key);
  if (step) return step.pct;
  if (s.includes("review")) return 40;
  if (s.includes("reject")) return 100;
  return 25;
};

export default function ApplicationCasePanel({ applicationId, onUpdated }) {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);
  const [team, setTeam] = useState([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [statusDraft, setStatusDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!applicationId || !token) return;
    setLoading(true);
    setError("");
    try {
      const [detailsRes, activityRes, commentsRes, teamRes] = await Promise.all([
        getApplicationDetails(token, applicationId),
        getApplicationActivity(token, applicationId),
        axios.get(`${apiBase()}/orders/application/${applicationId}/comments`, authHeaders(token)),
        getTeamMembers(token),
      ]);

      const details =
        detailsRes?.data?.data?.results ||
        detailsRes?.data?.results ||
        detailsRes?.data?.data ||
        null;
      setApp(details);
      setStatusDraft(details?.applicationStatus || details?.status || "submitted");
      setAssigneeId(details?.assignedAdminId || "");

      const act =
        activityRes?.data?.data?.results?.activities ||
        activityRes?.data?.results?.activities ||
        [];
      setActivities(Array.isArray(act) ? act : []);

      const comm =
        commentsRes?.data?.data?.results?.comments ||
        commentsRes?.data?.results?.comments ||
        [];
      setComments(Array.isArray(comm) ? comm : []);

      const members =
        teamRes?.data?.data?.results ||
        teamRes?.data?.results ||
        [];
      setTeam(Array.isArray(members) ? members : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load case details");
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssign = async () => {
    const member = team.find((m) => m.id === assigneeId);
    setSaving(true);
    try {
      await assignApplication(token, applicationId, {
        assignedAdminId: member?.id || assigneeId || undefined,
        assignedAdminEmail: member?.email,
        assignedAdminName: member?.name,
      });
      await load();
      onUpdated?.();
    } catch (e) {
      setError(e.message || "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async () => {
    setSaving(true);
    try {
      await updateApplicationStatus(token, applicationId, { status: statusDraft });
      await load();
      onUpdated?.();
    } catch (e) {
      setError(e.message || "Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${apiBase()}/orders/application/${applicationId}/comments`,
        { comment: newComment.trim(), isInternal },
        authHeaders(token)
      );
      setNewComment("");
      await load();
    } catch (e) {
      setError(e.message || "Failed to post comment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-white/50 text-sm py-4">Loading case panel...</p>;
  }

  const status = app?.applicationStatus || app?.status || "submitted";
  const progress = progressForStatus(status);

  return (
    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div>
        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Case progress</p>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-[#7350FF] to-[#A855F7] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-white/80 capitalize">{status.replace(/_/g, " ")} ({progress}%)</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Assign to team member</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id} className="text-black">
                {m.name} ({m.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={handleAssign}
            className="mt-2 text-xs px-3 py-1.5 bg-[#7350FF] rounded-md disabled:opacity-50"
          >
            Save assignment
          </button>
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Update status</label>
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            {PROGRESS_STEPS.map((s) => (
              <option key={s.key} value={s.key} className="text-black">
                {s.label}
              </option>
            ))}
            <option value="rejected" className="text-black">Rejected</option>
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={handleStatus}
            className="mt-2 text-xs px-3 py-1.5 bg-white/20 rounded-md disabled:opacity-50"
          >
            Update status
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Customer – agent discussion</p>
        <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
          {comments.length === 0 && (
            <p className="text-white/40 text-sm">No messages yet.</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className={`text-sm rounded-lg p-2 ${
                c.isInternal ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5 border border-white/10"
              }`}
            >
              <p className="text-white/90">{c.comment}</p>
              <p className="text-white/40 text-xs mt-1">
                {c.adminEmail || c.authorEmail || "Agent"}
                {c.isInternal ? " · internal" : " · customer visible"}
                {" · "}
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          placeholder="Write a message..."
          className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm mb-2"
        />
        <label className="flex items-center gap-2 text-xs text-white/60 mb-2">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          Internal note only (not emailed to customer)
        </label>
        <button
          type="button"
          disabled={saving || !newComment.trim()}
          onClick={handleComment}
          className="text-xs px-3 py-1.5 bg-[#7350FF] rounded-md disabled:opacity-50"
        >
          Post message
        </button>
      </div>

      <div>
        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Actions log</p>
        <ul className="max-h-36 overflow-y-auto space-y-1 text-sm text-white/70">
          {activities.map((a, idx) => (
            <li key={a.id || idx} className="border-l-2 border-[#7350FF]/40 pl-2">
              <span className="text-white/90">{a.description}</span>
              <span className="block text-xs text-white/40">
                {a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}
                {a.adminEmail ? ` · ${a.adminEmail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
