// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportChat') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const format = request.format;
    const filename = `deepseek-chat-${timestamp}.${format}`;

    try {
      let blob;
      if (format === 'html') {
        const htmlContent = generateHtml(request.content);
        blob = new Blob([htmlContent], { type: 'text/html' });
      } else if (format === 'md') {
        const markdownContent = request.content.markdown;
        blob = new Blob([markdownContent], { type: 'text/markdown' });
      }

      chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename,
        saveAs: true
      });

      sendResponse({ success: true });
    } catch (error) {
      console.error('Export error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
});

function generateHtml(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${content.title}</title>
      <style>
        ${content.styles}
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
      ${content.html}
    </body>
    </html>
  `;
}
