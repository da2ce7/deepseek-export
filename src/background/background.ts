/// <reference types="chrome" />

import DOMPurify from "dompurify";

// Listen for messages from content script
chrome.runtime.onMessage.addListener(
  (
    request: {
      action: string;
      format: "html" | "md";
      content: string | HtmlContent;
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (_response: { success: boolean; error?: string }) => void,
  ) => {
    if (request.action !== "exportChat") {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `deepseek-chat-${timestamp}.${request.format}`;

      if (request.format === "html") {
        const htmlContent = generateHtml(request.content as HtmlContent);
        const blob = new Blob([htmlContent], { type: "text/html" });
        chrome.downloads.download({
          url: URL.createObjectURL(blob),
          filename,
          saveAs: true,
        });
      } else if (request.format === "md") {
        const markdownContent = request.content as string;
        const blob = new Blob([markdownContent], {
          type: "text/markdown;charset=utf-8",
        });
        chrome.downloads.download({
          url: URL.createObjectURL(blob),
          filename,
          saveAs: true,
        });
      }

      sendResponse({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error.message });
      } else {
        sendResponse({ success: false, error: "An unknown error occurred" });
      }
    }
  },
);

interface HtmlContent {
  html: string;
  styles: string;
  title: string;
}

function generateHtml(content: HtmlContent) {
  const sanitizedHtml = DOMPurify.sanitize(content.html);
  const sanitizedStyles = DOMPurify.sanitize(content.styles);
  const escapedTitle = escapeHtml(content.title);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapedTitle}</title>
      <style>
        ${sanitizedStyles}
        body { padding: 20px; font-family: Arial, sans-serif; }
        /* Fix content not showing up problem */
        body > div {
          display: contents;
          width: 100%;
          height: 100%;
        }
        /* Hide chat message textarea */
        body > div > div > div > div:nth-child(3) {
          display: none;
        }
      </style>
    </head>
    <body>
      ${sanitizedHtml}
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (m: string) => map[m]);
}
