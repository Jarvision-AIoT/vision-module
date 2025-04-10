from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64
import mediapipe as mp
import math

app = Flask(__name__)

# Mediapipe 설정
mp_hands = mp.solutions.hands # 손 인식 모델 생성
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,  # ✅ 최대 2개의 손까지 인식하도록 설정
    min_detection_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils # 손 관절에 시각적으로 선을 연결해주는 Util

def angle_between(v1, v2):
    """
    두 2D 벡터 사이의 각도(라디안 단위)를 반환
    """
    v1 = np.array(v1)
    v2 = np.array(v2)
    unit_v1 = v1 / np.linalg.norm(v1)
    unit_v2 = v2 / np.linalg.norm(v2)
    dot_product = np.clip(np.dot(unit_v1, unit_v2), -1.0, 1.0)
    angle = np.arccos(dot_product)  # 라디안
    return angle



def is_thumb_extended(hand):
    """
    엄지가 펴졌는지 굽혀졌는지를 각도로 판단
    - 0~30도: 펴짐
    - 40도 이상: 굽혀짐
    """
    wrist = hand.landmark[0]
    thumb_mcp = hand.landmark[2]
    thumb_tip = hand.landmark[4]

    v1 = [thumb_mcp.x - wrist.x, thumb_mcp.y - wrist.y]
    v2 = [thumb_tip.x - thumb_mcp.x, thumb_tip.y - thumb_mcp.y]

    angle = angle_between(v1, v2) * (180 / math.pi)  # 라디안 → 도

    return angle < 40  # 기준 각도 (경험적으로 30~40도 추천)


def get_finger_status(hand, handedness = 'Right'):
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

    # 엄지:
  #  if handedness == 'Right': # 오른손
  #      if hand.landmark[4].x < hand.landmark[3].x:
  #          fingers.append(1)
  #      else:
  #          fingers.append(0)
  #  else:  # 왼손
  #      if hand.landmark[4].x > hand.landmark[3].x:
  #          fingers.append(1)
  #      else:
  #          fingers.append(0)
  
    if is_thumb_extended(hand):
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

        # 거리가 30 pixel 이하면 OK Sign
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

    # 좌우 반전 복원 및 Video Frame을 Mediapipe Pipeline에 전달
    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(frame_rgb)

    # 제스처와 손가락 리스트 초기화
    gestures = []
    fingers_list = []

    if result.multi_hand_landmarks and result.multi_handedness:
        for idx, (hand_landmark, hand_handedness) in enumerate(zip(result.multi_hand_landmarks, result.multi_handedness)):
            handedness_label = hand_handedness.classification[0].label  # 'Left' or 'Right'

            fingers = get_finger_status(hand_landmark, handedness_label)
            gesture = recognize_gesture(
                fingers,
                hand=hand_landmark,
                image_width=frame.shape[1],
                image_height=frame.shape[0]
            )

            gestures.append({
                'hand': handedness_label,
                'gesture': gesture
            })

            fingers_list.append({
                'hand': handedness_label,
                'fingers': fingers
            })

            print(f"{handedness_label} hand: {gesture}, fingers: {fingers}")

    return jsonify({
        'gestures': gestures,      # [{'hand': 'Right', 'gesture': 'peace'}, ...]
        'fingers_list': fingers_list  # [{'hand': 'Left', 'fingers': [1,0,0,0,0]}, ...]
    })

if __name__ == '__main__':
    app.run(debug=True)