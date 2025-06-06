# Vision Module - Jarvision
홈캠(카메라) 기반 손동작 인식 기능. Mediapipe를 활용하여 손동작을 인식하고, 제스처 분석을 수행

## ✨ Application
- Mediapipe 기반 손동작 인식
- MLP 기반 손동작 모델 학습습

## 🔧 Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FE6F61?style=for-the-badge&logo=google&logoColor=white)
![Tensorflow](https://img.shields.io/badge/TensorFlow-FF3F06?style=for-the-badge&logo=tensorflow&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white) <br>

![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=Flask&logoColor=white)
![MQTT](https://img.shields.io/badge/Mqtt-lightgrey?logo=mqtt)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

## 📁 Directory Structure
```plaintext
VISION-MODULE/
├── model/
├── templates/
│   └── script.js
├── templates/
│   └── index.html
├── utils/
├── LICENSE             // License of classification model
├── README.md           // README
├── app.py              // Application with Dashboard
├── keypoint_classification_EN.ipynb    // Learning gesture
├── point_history_classification.ipynb  // Learning point gesture
├── requirements.txt    // Required packages
├── test_homecam.py     // Test homecam streaming
└── test_model.py       // Test model
```

## 🚀 Execution

### 1️⃣ 패키지 설치

```bash
pip install -r requirements.txt
```

### 2️⃣ 환경 설정

#### MQTT 브로커 설정

- 현재 MQTT 브로커는 다음과 같이 Public Broker로 설정되어있습니다.
- 사용자 브로커를 사용 중이라면 `app.py`에서 다음 코드를 설정합니다.
```python
# MQTT Setting
BROKER_ADDRESS = "{USER_BROKER_IP}"
BROKER_PORT = 1883
MQTT_TOPIC = "{USER_TOPIC}"
```

#### 홈캠 설정
- `app.py` 코드에서 IP 카메라 형식 홈캠의 RTSP URL을 설정합니다.
```python
RTSP_URL = "rtsp://{USER_ID}:{USER_PASSWORD}@{WIFI_IP}:554/stream2"
```

### 3️⃣ 앱 실행

- app을 실행시킵니다.
```bash
python app.py
```

### ✅ 접속 방법 (개발자 용)

웹 브라우저에서 다음 URL 접속:
```bash
http://localhost:5000  // e.g. http://127.0.0.1:5000
```

## Reference
* [MediaPipe](https://mediapipe.dev/)

## Author
Kazuhito Takahashi(https://twitter.com/KzhtTkhs)

## Translation and other improvements
Nikita Kiselov(https://github.com/kinivi)
 
## License 
hand-gesture-recognition-using-mediapipe is under [Apache v2 license](LICENSE).