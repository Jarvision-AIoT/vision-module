import cv2
import time

def monitor_rtsp_stream(rtsp_url):
    """
    RTSP 스트림을 연결하고 영상을 표시하는 함수
    
    매개변수:
        rtsp_url (str): RTSP 스트림 URL
    """
    cap = cv2.VideoCapture(rtsp_url)
    
    # 연결 확인
    if not cap.isOpened():
        print("RTSP 스트림에 연결할 수 없습니다!")
        return
    
    print("RTSP 스트림에 연결되었습니다!")
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("프레임을 받아오지 못했습니다. 재연결 시도 중...")
                cap.release()
                time.sleep(1)
                cap = cv2.VideoCapture(rtsp_url)
                continue
            
            cv2.imshow('RTSP Stream Monitor', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("모니터링을 종료합니다.")

if __name__ == "__main__":
    # RTSP URL (Tapo C200)
    rtsp_url = "rtsp://{USER_ID}:{USER_PASSWORD}@{WIFI_IP}:554/stream2"
    
    monitor_rtsp_stream(rtsp_url)