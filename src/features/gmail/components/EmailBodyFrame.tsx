"use client";

import { useEffect, useRef } from "react";

interface EmailBodyFrameProps {
  html: string;
}

export function EmailBodyFrame({ html }: EmailBodyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 12px 16px; font-family: sans-serif; word-break: break-word; line-height: 1.5; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  pre { white-space: pre-wrap; }
</style>
<script>
  function sendHeight() {
    var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    window.parent.postMessage({ type: 'email-iframe-height', height: h }, '*');
  }
  window.addEventListener('load', sendHeight);
  new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
</script>
</head>
<body>${html}</body>
</html>`;

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (
        e.data?.type === "email-iframe-height" &&
        typeof e.data.height === "number" &&
        iframeRef.current
      ) {
        iframeRef.current.style.height = e.data.height + 24 + "px";
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="w-full min-h-48 border-0"
      style={{ height: "400px" }}
      title="Email content"
    />
  );
}
