
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportChat') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `deepseek-chat-${timestamp}.${request.format}`;

    if (request.format === 'html') {
      const htmlContent = generateHtml(request.content);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename,
        saveAs: true
      });
    } else if (request.format === 'pdf') {
      // Handle PDF download
      const pdfBlob = dataURLtoBlob(request.pdfData);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      chrome.downloads.download({
        url: pdfUrl,
        filename,
        saveAs: true
      });
    }

    sendResponse({ success: true });
  }
});

// Helper function to convert data URL to Blob
function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
}

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


