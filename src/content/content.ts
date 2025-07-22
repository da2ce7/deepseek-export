/// <reference types="chrome" />
import "../styles/style.css";

// Structural selector (update as needed)
const CHAT_SELECTOR =
  "div#root > div > div:nth-child(1) > div > div:nth-child(3) > div > div:nth-child(2)";

initializeExportButton();

function initializeExportButton() {
  // Inject export button
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export Chat";
  exportButton.id = "export-button";
  document.body.appendChild(exportButton);

  // Export handler
  exportButton.addEventListener("click", async () => {
    try {
      const content = captureChatContent();

      chrome.runtime.sendMessage(
        {
          action: "exportChat",
          format: "html",
          content,
        },
        (response: { success: boolean; error?: any }) => {
          if (!response?.success) {
            console.error(
              "DeepSeek Export: HTML export failed:",
              response?.error,
            );
          }
        },
      );
    } catch (error: any) {
      console.error("DeepSeek Export: Export failed:", error);
      alert(`Export failed: ${error.message}`);
    }
  });
}

// Ensure elements have valid height
function ensureElementHeight(element: Element) {
  if (!element) return;

  const computedStyle = window.getComputedStyle(element);
  const height = computedStyle.height;

  if (height === "0px") {
    (element as HTMLElement).style.minHeight = "1px"; // Set a minimum height
  }

  // Handle flexbox and grid layouts
  if (computedStyle.display === "flex" && height === "0px") {
    (element as HTMLElement).style.flex = "1 1 auto";
  }
  if (computedStyle.display === "grid" && height === "0px") {
    (element as HTMLElement).style.gridAutoRows = "minmax(1px, auto)";
  }

  // Recursively check child elements
  Array.from(element.children).forEach((child) => ensureElementHeight(child));
}

// Force layout recalculation
function forceLayoutRecalculation(element: HTMLElement) {
  element.offsetHeight; // Forces reflow
}

// Capture chat content
function captureChatContent() {
  const chatContainer = document.querySelector<HTMLElement>(CHAT_SELECTOR);
  if (!chatContainer) {
    console.error("DeepSeek Export: Chat container not found!");
    throw new Error("Chat container not found");
  }

  // Force layout recalculation
  forceLayoutRecalculation(chatContainer);

  // Clone with styles
  const clone = chatContainer.cloneNode(true) as HTMLElement;

  // Ensure all elements have valid height
  ensureElementHeight(clone);

  // Capture images as data URLs
  Array.from(clone.querySelectorAll("img")).forEach((img) => {
    img.src = img.src.replace(/^blob:/, "");
  });

  // Capture relevant styles
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
