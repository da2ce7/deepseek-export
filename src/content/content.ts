/// <reference types="chrome" />
import "../styles/style.css";
import { toMarkdown } from "./to-markdown";

// Structural selectors (update as needed)
const SELECTORS = {
  CHAT_CONTAINER: "._0f72b0b",
  MESSAGE: "dad65929", // Keep for now, but not used in MD export
  USER_PROMPT: ".fbb737a4",
  AI_ANSWER: "._4f9bf79",
  AI_THINKING: ".e1675d8b",
  AI_RESPONSE: ".ds-markdown",
};

// Wait for the DOM to be ready before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI);
} else {
  initializeUI();
}

function initializeUI() {
  // Prevent re-initialization
  if (document.getElementById("export-container")) {
    return;
  }

  // Create a container for the export buttons
  const container = document.createElement("div");
  container.id = "export-container";
  document.body.appendChild(container);

  // Add export to HTML button
  const exportHtmlButton = document.createElement("button");
  exportHtmlButton.textContent = "Export to HTML";
  exportHtmlButton.id = "export-html-button";
  container.appendChild(exportHtmlButton);

  // Add export to Markdown button
  const exportMdButton = document.createElement("button");
  exportMdButton.textContent = "Export to Markdown";
  exportMdButton.id = "export-md-button";
  container.appendChild(exportMdButton);

  // Export handlers
  exportHtmlButton.addEventListener("click", () => handleExport("html"));
  exportMdButton.addEventListener("click", () => handleExport("md"));
}

function handleExport(format: "html" | "md") {
  try {
    const content =
      format === "html" ? captureChatContentHtml() : captureChatContentMd();

    chrome.runtime.sendMessage(
      {
        action: "exportChat",
        format,
        content,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response?.success) {
          console.error(
            `DeepSeek Export: ${format.toUpperCase()} export failed:`,
            response?.error,
          );
        }
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`DeepSeek Export: Export failed:`, error);
      alert(`Export failed: ${error.message}`);
    } else {
      console.error(`DeepSeek Export: Export failed:`, error);
      alert(`Export failed: An unknown error occurred`);
    }
  }
}

// Ensure elements have valid height for HTML export
function ensureElementHeight(element: Element) {
  if (!element) return;
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.height === "0px") {
    (element as HTMLElement).style.minHeight = "1px";
  }
  Array.from(element.children).forEach(ensureElementHeight);
}

// Force layout recalculation for HTML export
function forceLayoutRecalculation(element: HTMLElement) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight;
}

// Capture chat content for HTML export
function captureChatContentHtml() {
  const chatContainer = document.querySelector<HTMLElement>(
    SELECTORS.CHAT_CONTAINER,
  );
  if (!chatContainer) {
    throw new Error("Chat container not found");
  }

  forceLayoutRecalculation(chatContainer);
  const clone = chatContainer.cloneNode(true) as HTMLElement;
  ensureElementHeight(clone);

  Array.from(clone.querySelectorAll("img")).forEach((img) => {
    img.src = img.src.replace(/^blob:/, "");
  });

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");

  return {
    html: clone.outerHTML,
    styles,
    title: document.title,
  };
}

// Capture chat content for Markdown export
function captureChatContentMd() {
  const chatContainer = document.querySelector<HTMLElement>(
    SELECTORS.CHAT_CONTAINER,
  );
  if (!chatContainer) {
    throw new Error("Chat messages container not found");
  }
  return toMarkdown(chatContainer);
}
