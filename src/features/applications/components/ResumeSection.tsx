"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationResumeLink } from "@/server/actions/applications";
import { formatDate } from "@/lib/utils";
import type { UserResume } from "@/types/database";

interface ResumeSectionProps {
  applicationId: string;
  // Backward-compat: old file upload fields
  resumeFileName?: string | null;
  resumeFilePath?: string | null;
  resumeUploadDate?: Date | null;
  // New: saved resume links
  savedResumes: UserResume[];
  selectedResumeId?: string | null;
  resumeLimit: number;
}

const NONE_VALUE = "__none__";

export function ResumeSection({
  applicationId,
  resumeFileName,
  resumeFilePath,
  resumeUploadDate,
  savedResumes,
  selectedResumeId,
  resumeLimit,
}: ResumeSectionProps) {
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(selectedResumeId ?? null);
  const [saving, setSaving] = useState(false);

  const selectedResume = savedResumes.find((r) => r.id === currentResumeId) ?? null;
  const atLimit = savedResumes.length >= resumeLimit;

  async function handleSelect(value: string | null) {
    const newId = !value || value === NONE_VALUE ? null : value;
    setSaving(true);
    try {
      const result = await updateApplicationResumeLink(applicationId, newId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCurrentResumeId(newId);
      toast.success(newId ? "Resume linked" : "Resume unlinked");
    } catch {
      toast.error("Failed to update resume");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Backward-compat: old uploaded file ── */}
      {resumeFilePath && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30">
          <FileText className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{resumeFileName}</p>
            <p className="text-xs text-muted-foreground">
              Uploaded {formatDate(resumeUploadDate)}
            </p>
          </div>
          <a
            href={`/api/resumes/${encodeURIComponent(resumeFilePath)}?mode=inline`}
            target="_blank"
            rel="noopener noreferrer"
            title="View uploaded file"
          >
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </a>
        </div>
      )}

      {/* ── New: resume link selector ── */}
      {savedResumes.length === 0 ? (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">No resume links saved yet.</p>
          <a
            href="/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Add resume links on Profile
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Select
                value={currentResumeId ?? NONE_VALUE}
                onValueChange={handleSelect}
                disabled={saving}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue>
                    {!currentResumeId
                      ? "— None —"
                      : (savedResumes.find((r) => r.id === currentResumeId)?.name ?? "— None —")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>— None —</SelectItem>
                  {savedResumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {saving && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />}
          </div>

          {selectedResume && (
            <a
              href={selectedResume.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-full"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">Open</span>
            </a>
          )}

          {!atLimit ? (
            <a
              href="/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              Add more resume links on Profile
            </a>
          ) : (
            <a
              href="/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              Manage resume links on Profile
            </a>
          )}
        </div>
      )}
    </div>
  );
}
