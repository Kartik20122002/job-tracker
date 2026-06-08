"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";

interface KeywordTailorProps {
  position: string;
  notes?: string | null;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","up","about","into","through","during","before","after","above","below",
  "is","are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","shall","should","may","might","must","can","could","not","no",
  "nor","so","yet","both","either","neither","each","few","more","most","other",
  "some","such","than","too","very","just","as","if","then","than","that","this",
  "these","those","we","you","they","he","she","it","i","me","him","her","us","them",
  "our","your","their","its","my","his","what","which","who","whom","when","where",
  "why","how","all","any","both","each","every","few","more","most","several",
  "able","also","well","good","new","great","strong","excellent","proven","solid",
  "work","working","worked","works","team","teams","role","roles","position","job",
  "experience","years","year","knowledge","understanding","skills","skill","ability",
  "including","responsibilities","required","preferred","plus","bonus","nice","have",
  "need","use","using","used","ensure","make","build","develop","create","design",
  "implement","support","help","manage","lead","drive","own","take","set","get",
  "follow","write","read","provide","deliver","handle","define","identify","review",
  "analyse","analyze","opportunity","company","business","product","service","data",
  "based","across","within","between","along","around","over","under","out","off",
  "environment","process","processes","solution","solutions","project","projects",
  "candidate","candidates","looking","seeking","join","apply","application","like",
  "love","passionate","excited","motivated","ideal","successful","success","high",
]);

// Well-known tech skills vocabulary for boosted detection
const TECH_SKILLS = new Set([
  "react","reactjs","react.js","nextjs","next.js","vue","vuejs","angular","svelte",
  "typescript","javascript","python","java","golang","go","rust","c++","c#","kotlin",
  "swift","ruby","php","scala","elixir","haskell","r","matlab","bash","shell",
  "node","nodejs","node.js","express","fastapi","django","flask","spring","rails",
  "graphql","rest","grpc","websocket","oauth","jwt","openapi","swagger",
  "sql","nosql","postgresql","postgres","mysql","mongodb","redis","elasticsearch",
  "dynamodb","cassandra","sqlite","supabase","firebase","prisma","typeorm","sequelize",
  "aws","gcp","azure","docker","kubernetes","k8s","terraform","ansible","jenkins",
  "ci/cd","github","gitlab","bitbucket","git","devops","sre","linux","unix",
  "html","css","sass","scss","tailwind","tailwindcss","webpack","vite","babel",
  "jest","mocha","pytest","cypress","playwright","selenium","testing","tdd","bdd",
  "machine learning","deep learning","nlp","llm","ai","ml","tensorflow","pytorch",
  "pandas","numpy","scikit","sklearn","keras","transformers","langchain","openai",
  "microservices","serverless","api","sdk","cli","figma","jira","confluence","notion",
  "agile","scrum","kanban","oop","functional","solid","dry","design patterns",
  "system design","distributed systems","concurrency","multithreading","async",
  "security","encryption","tls","ssl","authentication","authorization","rbac",
  "performance","optimization","caching","cdn","load balancing","scalability",
  "data structures","algorithms","problem solving","analytical",
  "communication","collaboration","mentoring","leadership","ownership","initiative",
  "react native","flutter","ios","android","mobile","electron","tauri","wasm",
  "webassembly","three.js","d3","recharts","chartjs","mapbox","leaflet",
]);

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  // First pass: match multi-word tech skills
  for (const skill of TECH_SKILLS) {
    if (skill.includes(" ") && lower.includes(skill)) {
      found.add(skill);
    }
  }

  // Second pass: tokenize and match single-word skills + extract other meaningful tokens
  const tokens = lower
    .replace(/[^a-z0-9.#+\s/-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const clean = token.replace(/[.,;:!?()[\]{}'"]/g, "").trim();
    if (!clean || clean.length < 2) continue;
    if (STOP_WORDS.has(clean)) continue;
    // Keep numbers that look like version specs (e.g. "5+") or years
    if (/^\d+$/.test(clean) && clean.length < 4) continue;
    if (TECH_SKILLS.has(clean)) {
      found.add(clean);
    } else if (clean.length >= 3 && !STOP_WORDS.has(clean) && /[a-z]/.test(clean)) {
      found.add(clean);
    }
  }

  return Array.from(found).sort();
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function KeywordTailor({ position, notes }: KeywordTailorProps) {
  const [open, setOpen] = useState(false);
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");

  const profileText = `${position} ${notes ?? ""}`;

  const { matched, missing, total } = useMemo(() => {
    if (!jdText.trim()) return { matched: [], missing: [], total: 0 };

    const jdKeywords = extractKeywords(jdText);
    const haystack = normalize(resumeText || profileText);

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of jdKeywords) {
      if (haystack.includes(normalize(kw))) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    return { matched, missing, total: jdKeywords.length };
  }, [jdText, resumeText, profileText]);

  const matchPct = total > 0 ? Math.round((matched.length / total) * 100) : 0;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Resume Keyword Match</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Paste Job Description
              </label>
              <Textarea
                placeholder="Paste the full job description here..."
                className="min-h-[180px] text-sm resize-none"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Paste Your Resume Text{" "}
                <span className="text-muted-foreground/60 normal-case font-normal">(optional — uses notes if blank)</span>
              </label>
              <Textarea
                placeholder="Paste your resume text for a more accurate match..."
                className="min-h-[180px] text-sm resize-none"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          </div>

          {total > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${matchPct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {matched.length}/{total} matched ({matchPct}%)
                </span>
              </div>

              {missing.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Missing from resume
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs border-orange-300 text-orange-600 dark:text-orange-400">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {matched.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Found in resume
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matched.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs border-green-400 text-green-600 dark:text-green-400">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!jdText.trim() && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Paste a job description above to see keyword gaps.
            </p>
          )}

          {jdText.trim() && total === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No extractable keywords found — try pasting more of the JD.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
