import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationForm } from "@/features/applications/components/ApplicationForm";
import { cn } from "@/lib/utils";

export default function NewApplicationPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/applications"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Application</h1>
        </div>
      </div>
      <ApplicationForm />
    </div>
  );
}
