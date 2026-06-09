"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationResumeLink } from "@/server/actions/applications";
import type { UserResume } from "@/types/database";

interface ResumeSectionProps {
  applicationId: string;
  savedResumes: UserResume[];
  selectedResumeId?: string | null;
  resumeLimit: number;
}

const NONE_VALUE = "__none__";

export function ResumeSection({
  applicationId,
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

  if (savedResumes.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
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

      <div className="flex flex-col gap-1.5">
        {selectedResume && (
          <a
            href={selectedResume.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            Open resume
          </a>
        )}

        <a
          href="/profile"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="h-3 w-3" />
          {atLimit ? "Manage resume links on Profile" : "Add more resume links on Profile"}
        </a>
      </div>
    </div>
  );
}
