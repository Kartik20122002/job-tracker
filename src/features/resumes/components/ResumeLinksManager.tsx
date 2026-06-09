"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserResume, updateUserResume, deleteUserResume } from "@/server/actions/resumes";
import type { UserResume } from "@/types/database";

interface ResumeLinksManagerProps {
  resumes: UserResume[];
  limit: number;
}

interface EditingState {
  id: string;
  name: string;
  link: string;
}

export function ResumeLinksManager({ resumes: initialResumes, limit }: ResumeLinksManagerProps) {
  const [resumes, setResumes] = useState<UserResume[]>(initialResumes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLink, setAddLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const atLimit = resumes.length >= limit;

  async function handleAdd() {
    if (!addName.trim() || !addLink.trim()) return;
    setAdding(true);
    try {
      const result = await createUserResume(addName.trim(), addLink.trim());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      // Optimistic update with temp id; page will revalidate
      const newResume: UserResume = {
        id: result.data!.id,
        userId: "",
        name: addName.trim(),
        link: addLink.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setResumes((prev) => [newResume, ...prev]);
      setAddName("");
      setAddLink("");
      setShowAddForm(false);
      toast.success("Resume link saved");
    } catch {
      toast.error("Failed to save resume link");
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const result = await updateUserResume(editing.id, editing.name, editing.link);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setResumes((prev) =>
        prev.map((r) =>
          r.id === editing.id ? { ...r, name: editing.name, link: editing.link } : r
        )
      );
      setEditing(null);
      toast.success("Resume link updated");
    } catch {
      toast.error("Failed to update resume link");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteUserResume(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume link deleted");
    } catch {
      toast.error("Failed to delete resume link");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Usage counter */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {resumes.length} / {limit} resume links used
        </p>
        {!atLimit && !showAddForm && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Resume
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <Input
            placeholder="Resume name (e.g. SWE Resume v2)"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Link (Google Drive, Notion, Dropbox...)"
            value={addLink}
            onChange={(e) => setAddLink(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding || !addName.trim() || !addLink.trim()}>
              {adding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAddForm(false); setAddName(""); setAddLink(""); }}
              disabled={adding}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Resume list */}
      {resumes.length === 0 && !showAddForm ? (
        <p className="text-sm text-muted-foreground">
          No resume links saved yet. Add up to {limit} links.
        </p>
      ) : (
        <div className="space-y-2">
          {resumes.map((resume) => (
            <div key={resume.id} className="rounded-lg border p-3 space-y-2">
              {editing?.id === resume.id ? (
                <>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editing.link}
                    onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resume.name}</p>
                    <a
                      href={resume.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{resume.link}</span>
                    </a>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ id: resume.id, name: resume.name, link: resume.link })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      {deletingId === resume.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground">
          Limit reached ({limit} resumes). Delete one to add another.
        </p>
      )}
    </div>
  );
}
