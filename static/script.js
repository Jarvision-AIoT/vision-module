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

async function sendFrame() {
  try {
    // 비디오에서 이미지 캡처
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg');

    // 서버로 전송
    const response = await fetch('/analyze', {
      method: 'POST',
      body: JSON.stringify({ image }),
      headers: { 'Content-Type': 'application/json' }
    });

    // 응답 확인
    if (!response.ok) {
      console.error('서버 응답 오류:', response.status);
      return;
    }

    // JSON 응답 파싱
    const result = await response.json();

    // 초기 상태 설정
    document.getElementById('leftHand').innerText = '왼손 인식 안됨';
    document.getElementById('rightHand').innerText = '오른손 인식 안됨';
    document.getElementById('fingerStatus').innerText = '';

    // 제스처 카운트 업데이트
    if (result.gestures && Array.isArray(result.gestures)) {
      result.gestures.forEach(g => {
        if (g.hand && g.gesture) {
          const targetCounts = g.hand === 'Left' ? leftGestureCounts : rightGestureCounts;
          if (g.gesture in targetCounts) {
            targetCounts[g.gesture]++;
          }
        }
      });
    }
    
    // 차트 업데이트
    if (leftChart && leftChart.update) {
      leftChart.data.datasets[0].data = Object.values(leftGestureCounts);
      leftChart.update();
    }
    
    if (rightChart && rightChart.update) {
      rightChart.data.datasets[0].data = Object.values(rightGestureCounts);
      rightChart.update();
    }

    // 제스처 표시 업데이트
    if (result.gestures && Array.isArray(result.gestures)) {
      result.gestures.forEach(g => {
        if (g.hand && g.gesture) {
          const emojiGesture = getGestureWithEmoji(g.gesture);
          
          if (g.hand === 'Left') {
            document.getElementById('leftHand').innerText = `🖐 왼손 제스처: ${emojiGesture}`;
          } else if (g.hand === 'Right') {
            document.getElementById('rightHand').innerText = `✋ 오른손 제스처: ${emojiGesture}`;
          }
        }
      });
    }

    // 손가락 상태 업데이트
    if (result.fingers_list && Array.isArray(result.fingers_list)) {
      result.fingers_list.forEach(f => {
        if (f.hand && f.fingers) {
          const fingerText = `손가락 상태: [${f.fingers.join(', ')}]`;
          
          if (f.hand === 'Left') {
            document.getElementById('leftFingers').innerText = fingerText;
          } else if (f.hand === 'Right') {
            document.getElementById('rightFingers').innerText = fingerText;
          }
        }
      });
    }

    // Firebase로 제스처 전송
    if (result.gestures && Array.isArray(result.gestures)) {
      result.gestures.forEach(g => {
        if (g.hand && g.gesture) {
          const hand = g.hand;
          const gesture = g.gesture;
          
          // gestureBuffer 객체가 존재하는지 확인
          if (!gestureBuffer[hand]) {
            gestureBuffer[hand] = { prevGesture: null, count: 0 };
          }
          
          const buffer = gestureBuffer[hand];
          
          if (buffer.prevGesture === gesture) {
            buffer.count++;
          } else {
            buffer.prevGesture = gesture;
            buffer.count = 1;
          }
          
          // 안정성 임계값에 도달하고 이전에 전송된 제스처와 다른 경우 전송
          if (buffer.count === STABILITY_THRESHOLD && sentGesture[hand] !== gesture) {
            sendGestureToFirebase(hand, gesture);
            sentGesture[hand] = gesture;
          }
        }
      });
    }
  } catch (error) {
    console.error('sendFrame 실행 중 오류:', error);
  }
}

// 정해진 간격으로 프레임 전송
setInterval(sendFrame, 1000);
