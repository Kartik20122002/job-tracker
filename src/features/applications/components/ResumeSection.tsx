"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, Loader2, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateApplicationResume } from "@/server/actions/applications";
import { formatDate } from "@/lib/utils";

interface ResumeSectionProps {
  applicationId: string;
  resumeFileName?: string | null;
  resumeFilePath?: string | null;
  resumeUploadDate?: Date | null;
  isUploadAllowed?: boolean;
}

export function ResumeSection({
  applicationId,
  resumeFileName,
  resumeFilePath,
  resumeUploadDate,
  isUploadAllowed = false,
}: ResumeSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }

      const result = await updateApplicationResume(
        applicationId,
        file.name,
        data.fileName
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Resume uploaded successfully");
      window.location.reload();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {resumeFilePath ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <FileText className="h-8 w-8 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{resumeFileName}</p>
            <p className="text-xs text-muted-foreground">
              Uploaded {formatDate(resumeUploadDate)}
            </p>
          </div>
          <div className="flex gap-1">
            <a
              href={`/api/resumes/${encodeURIComponent(resumeFilePath)}?mode=inline`}
              target="_blank"
              rel="noopener noreferrer"
              title="Preview"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
            </a>
            <a
              href={`/api/resumes/${encodeURIComponent(resumeFilePath)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Download"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
      )}

      {isUploadAllowed ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {resumeFilePath ? "Replace Resume" : "Upload Resume"}
          </Button>
          <p className="text-xs text-muted-foreground">PDF only, max 1 MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Lock className="mr-2 h-4 w-4" />
            {resumeFilePath ? "Replace Resume" : "Upload Resume"}
          </Button>
          <p className="text-xs text-muted-foreground">Resume upload is not enabled for your account</p>
        </div>
      )}
    </div>
  );
}
