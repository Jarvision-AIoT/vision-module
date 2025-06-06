const video = document.getElementById('webcam');
const analyzedImage = document.getElementById('analyzedImage');

// Webcam Access
//navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
//  .then(stream => {
//    video.srcObject = stream;
//  })
//  .catch(console.error);

let isProcessing = false;
let lastRequest = Date.now();
let minInterval = 100;  // Initial value 10fps

async function sendFrame() {
  if (isProcessing) return;
  isProcessing = true;
  const start = performance.now();

  try {
    const response = await fetch('/analyze', { method: 'POST' });
    const result = await response.json();

    if (result.image) {
      analyzedImage.src = result.image;
    }
  } catch (error) {
    console.error("Error during frame fetch:", error);
  } finally {
    const end = performance.now();
    const elapsed = end - start;
    minInterval = Math.max(50, elapsed + 10);  // Max 20fps
    setTimeout(() => {
      isProcessing = false;
      sendFrame();
    }, minInterval);
  }
}

// Initial Request
sendFrame();