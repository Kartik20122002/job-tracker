"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteEmailActivity } from "@/server/actions/gmail";

interface DeleteEmailButtonProps {
  id: string;
  redirectTo?: string;
}

export function DeleteEmailButton({ id, redirectTo }: DeleteEmailButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await deleteEmailActivity(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete email.");
        return;
      }
      toast.success("Email removed.");
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      disabled={loading}
      onClick={handleDelete}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
