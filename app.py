from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64
import mediapipe as mp

app = Flask(__name__)

# Mediapipe 설정
mp_hands = mp.solutions.hands # 손 인식 모델 생성
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils # 손 관절에 시각적으로 선을 연결해주는 Util

def get_finger_status(hand):
    """
    손가락이 펴져 있는지 접혀 있는지 확인하는 함수

    Input:
        hand
    Returns:
        fingers_status[i, i, i, i, i](list)
        - 1: 펴져 있을 때
        - 0: 접혀 있을 때
    """
    # 오른손 기준
    fingers = []

    # 엄지 (오른손 기준):
    # 랜드마크 4가 랜드마크 3의 왼쪽에 있으면 펼쳐진 상태
    if hand.landmark[4].x < hand.landmark[3].x:
        fingers.append(1)
    else:
        fingers.append(0)

    # 나머지 손가락 (오른손 기준):
    # 각 손가락의 팁 (8, 12, 16, 20)이 PIP (6, 10, 14, 18) 위에 있으면 펼쳐진 상태
    tips = [8, 12, 16, 20]
    pip_joints = [6, 10, 14, 18]
    for tip, pip in zip(tips, pip_joints):
        if hand.landmark[tip].y < hand.landmark[pip].y:
            fingers.append(1)
        else:
            fingers.append(0)

    return fingers

def recognize_gesture(fingers_status, hand=None, image_width=None, image_height=None):

    # OK 사인: 엄지(4번)와 검지(8번) 끝 사이 거리 기준
    if hand and image_width and image_height:
        thumb_tip = hand.landmark[4]
        index_tip = hand.landmark[8]

        dx = (thumb_tip.x - index_tip.x) * image_width
        dy = (thumb_tip.y - index_tip.y) * image_height
        distance = (dx**2 + dy**2)**0.5

        if distance < 30:
            return 'ok_sign' #👌

    if fingers_status == [0, 0, 0, 0, 0]:
        return 'fist'       #✊
    elif fingers_status == [0, 1, 0, 0, 0]:
        return 'point'      #☝️
    elif fingers_status == [1, 1, 1, 1, 1]:
        return 'open'       #✋
    elif fingers_status == [0, 1, 1, 0, 0]:
        return 'peace'      #✌️
    elif fingers_status == [1, 1, 0, 0, 0]:
        return 'standby'    #👆
    elif fingers_status == [1, 0, 0, 0, 0]:
        return 'thumbs_up'  #👍
    elif fingers_status == [1, 0, 0, 0, 1]:
        return 'rock'       #🤙
    elif fingers_status == [1, 1, 0, 0, 1]:
        return 'love_u'     #🤟

    return 'none'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    img_data = base64.b64decode(data['image'].split(',')[1])
    np_img = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    # 좌우 반전 복원
    frame = cv2.flip(frame, 1)

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(frame_rgb)

    gesture = 'none'
    fingers = []

    if result.multi_hand_landmarks:
        hand_landmark = result.multi_hand_landmarks[0]

        fingers = get_finger_status(result.multi_hand_landmarks[0])
        gesture = recognize_gesture(
            fingers,
            hand=hand_landmark,
            image_width=frame.shape[1],
            image_height=frame.shape[0]
        )

        print(gesture)
        # 손 랜드마크와 연결선 그리기
        # mp_drawing.draw_landmarks(frame, result.multi_hand_landmarks, mp_hands.HAND_CONNECTIONS)

    return jsonify({
        'gesture': gesture,
        'fingers': fingers  # fingers = [0, 1, 0, 0, 0] 같은 리스트
    })

if __name__ == '__main__':
    app.run(debug=True)