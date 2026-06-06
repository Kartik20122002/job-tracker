const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export class GmailApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "GmailApiError";
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GmailMessageStub {
  id: string;
  threadId: string;
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: Date;
}

export function buildGmailAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new GmailApiError(response.status, `Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new GmailApiError(response.status, `Token refresh failed: ${error}`);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string }> {
  const response = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new GmailApiError(response.status, "Failed to fetch Gmail profile");
  }

  return response.json();
}

export async function searchGmailMessages(
  accessToken: string,
  query: string,
  maxResults = 50
): Promise<GmailMessageStub[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const response = await fetch(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new GmailApiError(
      response.status,
      body?.error?.message ?? "Gmail messages search failed"
    );
  }

  const data = await response.json();
  return (data.messages as GmailMessageStub[]) ?? [];
}

export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<ParsedEmail | null> {
  const params = new URLSearchParams({ format: "metadata" });
  params.append("metadataHeaders", "From");
  params.append("metadataHeaders", "Subject");

  const response = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const message: GmailMessageDetail = await response.json();

  const headers = message.payload?.headers ?? [];
  const fromHeader = headers.find((h) => h.name === "From")?.value ?? "";
  const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";

  const { sender, senderEmail } = parseFromHeader(fromHeader);

  return {
    messageId: message.id,
    threadId: message.threadId,
    sender,
    senderEmail,
    subject,
    snippet: message.snippet ?? "",
    receivedAt: new Date(parseInt(message.internalDate)),
  };
}

interface GmailPayload {
  mimeType: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; size?: number };
  parts?: GmailPayload[];
}

export interface ParsedEmailFull extends ParsedEmail {
  body: string;
  bodyHtml: string | null;
  gmailWebUrl: string;
}

export async function getGmailMessageFull(
  accessToken: string,
  messageId: string,
  threadId: string
): Promise<ParsedEmailFull | null> {
  const response = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const message = await response.json();
  const headers: Array<{ name: string; value: string }> = message.payload?.headers ?? [];
  const fromHeader = headers.find((h: { name: string }) => h.name === "From")?.value ?? "";
  const subject = headers.find((h: { name: string }) => h.name === "Subject")?.value ?? "(no subject)";
  const { sender, senderEmail } = parseFromHeader(fromHeader);

  const body = extractTextFromPayload(message.payload);
  const bodyHtml = extractHtmlFromPayload(message.payload);

  return {
    messageId: message.id,
    threadId,
    sender,
    senderEmail,
    subject,
    snippet: message.snippet ?? "",
    receivedAt: new Date(parseInt(message.internalDate)),
    body,
    bodyHtml,
    gmailWebUrl: `https://mail.google.com/mail/u/0/#all/${threadId}`,
  };
}

function extractTextFromPayload(payload: GmailPayload): string {
  if (!payload) return "";

  // Direct text/plain
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  if (payload.parts) {
    // Prefer text/plain in parts
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    // Recurse into nested multipart
    for (const part of payload.parts) {
      if (part.mimeType.startsWith("multipart/")) {
        const text = extractTextFromPayload(part);
        if (text) return text;
      }
    }
    // Fall back to text/html, strip tags
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64url").toString("utf-8");
        return stripHtml(html);
      }
    }
  }

  // Direct text/html fallback
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    return stripHtml(html);
  }

  return "";
}

function extractHtmlFromPayload(payload: GmailPayload): string | null {
  if (!payload) return null;

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType.startsWith("multipart/")) {
        const html = extractHtmlFromPayload(part);
        if (html) return html;
      }
    }
  }

  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Block-level elements → newlines to preserve paragraph structure
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|tr|li|h[1-6]|blockquote|section|article|header|footer|address)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&[a-z]+;/gi, " ")
    // Collapse horizontal whitespace but keep newlines
    .replace(/[^\S\n]{2,}/g, " ")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseFromHeader(from: string): { sender: string; senderEmail: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      sender: match[1].trim().replace(/^"|"$/g, "") || match[2].trim(),
      senderEmail: match[2].trim().toLowerCase(),
    };
  }
  const email = from.trim().toLowerCase();
  return { sender: email, senderEmail: email };
}
