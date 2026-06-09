"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralTemplateButtonProps {
  company: string;
  position: string;
  jobLink?: string | null;
  resumeName?: string | null;
  resumeLink?: string | null;
}

export function ReferralTemplateButton({
  company,
  position,
  jobLink,
  resumeName,
  resumeLink,
}: ReferralTemplateButtonProps) {
  const [copied, setCopied] = useState(false);

  function buildTemplate() {
    let template = `Hi [Name],

I came across an opening at ${company} for ${position} that aligns well with my experience. I've attached my resume for your review.

If you feel my profile is a good fit for the role, I would greatly appreciate a referral. Thank you for your time and consideration.

Position Link: ${jobLink ?? "[position link]"}`;

    if (resumeLink) {
      template += `\nResume Link: ${resumeLink}`;
    }

    return template;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildTemplate());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 w-44 justify-center">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy Referral Template"}
    </Button>
  );
}
