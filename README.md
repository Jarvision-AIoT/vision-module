# Vision Module - Jarvision
카메라 기반 손동작 인식 기능. Mediapipe를 활용하여 손동작을 인식하고, 제스처 분석을 수행

## ✨ Application
- Mediapipe 기반 손동작 인식
- Chart.js 기반 차트보드 제공

## 🔧 Tech Stack

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)![MediaPipe](https://img.shields.io/badge/MediaPipe-FE6F61?style=for-the-badge&logo=google&logoColor=white)![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

## 📁 Directory Structure
```plaintext
VISION-MODULE/
├── static/
│   └── script.js
├── templates/
├── app.py
├── firebase_config.py
├── README.md
└── requirements.txt
```

## 🚀 Execution

#### 1️⃣ 패키지 설치

```bash
pip install -r requirements.txt
```

### 2️⃣ 환경 변수 세팅

- `firebase_keys/`에 유저 Firebase 계정 키 JSON 파일 `firebase_key_user.json`이 있어야 하고,
- 환경 변수 `GOOGLE_APPLICATION_CREDENTIALS`를 새로 생성하여 `your/path/to/firebase_key_user.json`로 설정해야 합니다.

### 3️⃣ 앱 실행

```bash
python app.py
```

#### ✅ 접속 방법

웹 브라우저에서 다음 URL 접속:
```
http://localhost:5000
// e.g. http://127.0.0.1:5000
```