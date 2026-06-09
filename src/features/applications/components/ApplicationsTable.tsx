"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/enums";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteApplication, duplicateApplication } from "@/server/actions/applications";
import { cn, formatDate } from "@/lib/utils";
import type { Application } from "@/types/database";

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

interface ApplicationsTableProps {
  applications: Application[];
}

type DeleteTarget = { id: string; company: string; position: string } | null;

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDuplicate(id: string) {
    const result = await duplicateApplication(id);
    if (result.success && result.data) {
      toast.success("Application duplicated");
      router.push(`/applications/${result.data.id}`);
    } else if (!result.success) {
      toast.error(result.error ?? "Failed to duplicate");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await deleteApplication(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete");
        return;
      }
      toast.success("Application deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No applications found.</p>
        <Link href="/applications/new" className="mt-2 text-sm text-primary hover:underline">
          Add your first application
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="hidden md:table-cell">Job Link</TableHead>
              {/* <TableHead className="hidden lg:table-cell">Location</TableHead> */}
              <TableHead className="hidden sm:table-cell">Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => {
              const isWaitingStatus =
                app.status === ApplicationStatus.Started ||
                app.status === ApplicationStatus.Referral_Asked;
              const staleDays = isWaitingStatus ? daysSince(app.createdAt) : 0;
              const isStaleReferral = staleDays > 1;

              return (
              <TableRow
                key={app.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  isStaleReferral && "border-l-2 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
                )}
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <TableCell className="font-medium">{app.company}</TableCell>
                <TableCell className="text-muted-foreground">{app.position}</TableCell>
                <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                  {app.jobLink ? (
                    <a
                      href={app.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{app.location ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {formatDate(app.appliedDate)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={app.status} />
                    {isStaleReferral && (
                      <span
                        title={`${app.status === ApplicationStatus.Started ? "Started" : "Referral"} pending for ${staleDays} day${staleDays !== 1 ? "s" : ""} — consider following up`}
                        className="shrink-0"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/applications/${app.id}`)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/applications/${app.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(app.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget({ id: app.id, company: app.company, position: app.position })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog — rendered outside the dropdown so it doesn't unmount with it */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application for{" "}
              <strong>{deleteTarget?.position}</strong> at{" "}
              <strong>{deleteTarget?.company}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
