const video = document.getElementById('webcam');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Chart setup
const gestureCounts = { fist: 0, point: 0, open: 0, peace: 0, standby: 0, unknown: 0, rock: 0, thumbs_up: 0 };
const chart = new Chart(document.getElementById('gestureChart'), {
  type: 'bar',
  data: {
    labels: Object.keys(gestureCounts),
    datasets: [{
      label: 'Gesture Count',
      data: Object.values(gestureCounts),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }]
  },
  options: {
    scales: { y: { beginAtZero: true } }
  }
});

navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user" }
}).then(stream => {
  video.srcObject = stream;
});

function updateChart(gesture) {
  if (gesture in gestureCounts) {
    gestureCounts[gesture]++;
    chart.data.datasets[0].data = Object.values(gestureCounts);
    chart.update();
  }
}

async function sendFrame() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const image = canvas.toDataURL('image/jpeg');

  const res = await fetch('/analyze', {
    method: 'POST',
    body: JSON.stringify({ image }),
    headers: { 'Content-Type': 'application/json' }
  });

  const result = await res.json();

  // 차트 업데이트
  updateChart(result.gesture);

  // 손가락 상태 표시
  if (result.fingers) {
    document.getElementById('fingerStatus').innerText =
      `손가락 상태: [${result.fingers.join(', ')}]`;
  }

  // 제스처 이름 표시
  document.getElementById('gestureName').innerText =
    `현재 제스처: ${result.gesture}`;
}

setInterval(sendFrame, 1000);