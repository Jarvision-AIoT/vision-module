const video = document.getElementById('webcam');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// HAND STABILITY CHECKING VARIABLES
const STABILITY_THRESHOLD = 3;
let gestureBuffer = {
  Left: { prevGesture: null, count: 0 },
  Right: { prevGesture: null, count: 0 }
};
let sentGesture = {
  Left: null,
  Right: null
};

// CHART SETUP
// LEFT/RIGHT GESTURE COUNT
const leftGestureCounts = { fist: 0, point: 0, open: 0, peace: 0, standby: 0, unknown: 0, rock: 0, thumbs_up: 0, ok_sign: 0 };
const rightGestureCounts = { ...JSON.parse(JSON.stringify(leftGestureCounts)) }; // 딥카피

// CHART: LEFT GESTURE COUNT
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

// CHART: RIGHT GESTURE COUNTT
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

// GESTURE<->EMOJI DB
function getGestureWithEmoji(gesture) {
  const emojiMap = {
    'ok_sign': '👌',
    'fist': '✊',
    'point': '☝️',
    'open': '🖐️',
    'peace': '✌️',
    'standby': '👆',
    'thumbs_up': '👍',
    'rock': '🤘',
    'love_u': '🤟',
    'none': '❓'
  };

  const emoji = emojiMap[gesture] || '❓';
  return `${emoji} ${gesture}`;
}

function sendGestureToFirebase(hand, gesture) {
  fetch('/send_gesture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hand, gesture })
  });
}

// SEND FRAME TO FLASK & FIREBASE
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

  if (!res.ok) {
  console.error('서버가 실패 응답을 보냈습니다:', res.status);
  return;
}

const text = await res.text();
if (!text) {
  console.error('서버 응답이 비어있습니다.');
  return;
}

let result;
try {
  result = JSON.parse(text);
} catch (e) {
  console.error('JSON 파싱 오류:', e);
  return;
}

  const result = await res.json();

  // INITIALIZE
  document.getElementById('leftHand').innerText = '왼손 인식 안됨';
  document.getElementById('rightHand').innerText = '오른손 인식 안됨';
  document.getElementById('fingerStatus').innerText = '';

  // CHART UPDATE: LEFT/RIGHT
  result.gestures.forEach(g => {
    const targetCounts = g.hand === 'Left' ? leftGestureCounts : rightGestureCounts;
    if (g.gesture in targetCounts) {
      targetCounts[g.gesture]++;
    }
  });
  
  // CHART REDRAW: LEFT/RIGHT
  leftChart.data.datasets[0].data = Object.values(leftGestureCounts);
  leftChart.update();
  rightChart.data.datasets[0].data = Object.values(rightGestureCounts);
  rightChart.update();

  // DOCUMENT UPDATE: LEFT/RIGHT
  // - GESTURE NAME
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

  // - FINGER STATUS
  result.fingers_list.forEach(f => {
    const fingerText = `손가락 상태: [${f.fingers.join(', ')}]`;
  
    if (f.hand === 'Left') {
      document.getElementById('leftFingers').innerText = fingerText;
    } else if (f.hand === 'Right') {
      document.getElementById('rightFingers').innerText = fingerText;
    }
  });

  // SEND TO FIREBASE?
  result.gestures.forEach(g => {
    const hand = g.hand;
    const gesture = g.gesture;
  
    const buffer = gestureBuffer[hand];
  
    if (buffer.prevGesture === gesture) {
      buffer.count++;
    } else {
      buffer.prevGesture = gesture;
      buffer.count = 1;
    }
  
    // SEND IF ( COUNT REACHED CRITICAL VALUE || DIFFER FROM SENT BEFORE )
    if (buffer.count === STABILITY_THRESHOLD && sentGesture[hand] !== gesture) {
      sendGestureToFirebase(hand, gesture);
      sentGesture[hand] = gesture;
    }
  });  
}

setInterval(sendFrame, 1000);
