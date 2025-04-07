const video = document.getElementById('webcam');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// 차트 셋업
// 왼손/오른손 별로 카운트 객체를 나눔
const leftGestureCounts = { fist: 0, point: 0, open: 0, peace: 0, standby: 0, unknown: 0, rock: 0, thumbs_up: 0, ok_sign: 0 };
const rightGestureCounts = { ...JSON.parse(JSON.stringify(leftGestureCounts)) }; // 딥카피

// 왼손 차트
const leftChart = new Chart(document.getElementById('leftChart'), {
  type: 'bar',
  data: {
    labels: Object.keys(leftGestureCounts),
    datasets: [{
      label: 'Left Hand Gesture Count',
      data: Object.values(leftGestureCounts),
      backgroundColor: 'rgba(255, 99, 132, 0.6)'
    }]
  },
  options: { scales: { y: { beginAtZero: true } } }
});

// 오른손 차트
const rightChart = new Chart(document.getElementById('rightChart'), {
  type: 'bar',
  data: {
    labels: Object.keys(rightGestureCounts),
    datasets: [{
      label: 'Right Hand Gesture Count',
      data: Object.values(rightGestureCounts),
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  },
  options: { scales: { y: { beginAtZero: true } } }
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

function getGestureWithEmoji(gesture) {
  const emojiMap = {
    'ok_sign': '👌',
    'fist': '✊',
    'point': '👉',
    'open': '🖐️',
    'peace': '✌️',
    'standby': '🫲',
    'thumbs_up': '👍',
    'rock': '🤘',
    'love_u': '🤟',
    'none': '❓'
  };

  const emoji = emojiMap[gesture] || '❓';
  return `${emoji} ${gesture}`;
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

    // 초기화
  document.getElementById('leftHand').innerText = '왼손 인식 안됨';
  document.getElementById('rightHand').innerText = '오른손 인식 안됨';
  document.getElementById('fingerStatus').innerText = '';

  // Chart 업데이트: 양손 집계
  result.gestures.forEach(g => {
    const targetCounts = g.hand === 'Left' ? leftGestureCounts : rightGestureCounts;
    if (g.gesture in targetCounts) {
      targetCounts[g.gesture]++;
    }
  
    const emojiGesture = getGestureWithEmoji(g.gesture);
    if (g.hand === 'Left') {
      document.getElementById('leftHand').innerText = `🖐 왼손 제스처: ${emojiGesture}`;
    } else if (g.hand === 'Right') {
      document.getElementById('rightHand').innerText = `✋ 오른손 제스처: ${emojiGesture}`;
    }
  });
  
  // 차트 다시 그리기
  leftChart.data.datasets[0].data = Object.values(leftGestureCounts);
  leftChart.update();
  
  rightChart.data.datasets[0].data = Object.values(rightGestureCounts);
  rightChart.update();

  // 제스처 및 손가락 상태 표시
  result.gestures.forEach(g => {
    const emojiGesture = getGestureWithEmoji(g.gesture);
    if (g.hand === 'Left') {
      document.getElementById('leftHand').innerText =
        `🖐 왼손 제스처: ${emojiGesture}`;
    } else if (g.hand === 'Right') {
      document.getElementById('rightHand').innerText =
        `✋ 오른손 제스처: ${emojiGesture}`;
    }
  });

  result.fingers_list.forEach(f => {
    const fingerText = `손가락 상태: [${f.fingers.join(', ')}]`;
  
    if (f.hand === 'Left') {
      document.getElementById('leftFingers').innerText = fingerText;
    } else if (f.hand === 'Right') {
      document.getElementById('rightFingers').innerText = fingerText;
    }
  });
}

setInterval(sendFrame, 1000);