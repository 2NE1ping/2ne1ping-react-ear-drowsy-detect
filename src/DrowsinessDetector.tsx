import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import Header from "./Header";
import axios from "axios";
import styles from "./DrowsinessDetector.module.css";

const DrowsinessDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [isDrowsyByEAR, setIsDrowsyByEAR] = useState(false);
  const [isYawning, setIsYawning] = useState(false);
  const [isDrowsyByPERCLOS, setIsDrowsyByPERCLOS] = useState(false);
  const [isLongEyeClosureDetected, setIsLongEyeClosureDetected] =
    useState(false);
  // const [isBlinkFrequencyLow, setIsBlinkFrequencyLow] = useState(false);
  const [blinkTimestamps, setBlinkTimestamps] = useState<number[]>([]);
  const BLINK_TIME_WINDOW = 10000; // 10초
  const NORMAL_BLINK_RATE = 15; // 예: BLINK_TIME_WINDOW 동안 15회 깜빡임이 정상

  const alarmSoundRef = useRef(new Audio("/alert.mp3"));
  const isPlayingRef = useRef(false); // 현재 알람이 재생 중인지 여부를 저장
  const alarmCountRef = useRef(0); // 알람 재생 횟수를 저장하는 Ref
  const [isDrowsyByServer, setIsDrowsyByServer] = useState(false);

  const [sensorData, setSensorData] = useState<string>("");

  useEffect(() => {
    if (isDrowsyByEAR || isYawning || isDrowsyByPERCLOS || isDrowsyByServer) {
      setIsDrowsy(true);
    } else {
      setIsDrowsy(false);
    }
    console.log("isDrowsy:", isDrowsy);
  }, [isDrowsy]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      console.log("Received from Arduino:", event.data);
      setSensorData(event.data);
    };

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // console.log("Sensor Data:", sensorData);
    }, 5000);

    return () => clearInterval(interval);
  }, [sensorData]);

  const handleButtonClick = async (path: string = "") => {
    try {
      const response = await fetch(
        `http://localhost:3000/upload-sketch/${path}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        console.log("Arduino sketch upload initiated.");
      } else {
        console.error("Failed to initiate Arduino sketch upload.");
      }
    } catch (error) {
      console.error("Error sending POST request:", error);
    }
  };

  const playAlarm = () => {
    if (!isPlayingRef.current) {
      alarmSoundRef.current.play();
      isPlayingRef.current = true;
      alarmCountRef.current = 0; // 새로운 알람 재생 시작 시 카운트 초기화

      // 알람이 끝나면 바로 다음 알람을 재생
      alarmSoundRef.current.onended = () => {
        alarmCountRef.current += 1; // 알람 재생 횟수 증가
        if (alarmCountRef.current < 3) {
          // 3번 울리기까지 지연 없이 연속 재생
          alarmSoundRef.current.play();
        } else {
          // 3번 다 울린 후에는 재생 종료
          isPlayingRef.current = false;
        }
      };
    }
  };

  // // TODO: 실행되도록 수정하면 주석해제
  // useEffect(() => {
  //   const executeActions = async () => {
  //     if (isDrowsy && !isDrowsyByServer) {
  //       playAlarm();
  //       await handleButtonClick("camera");
  //     } else if (isDrowsy && isDrowsyByServer) {
  //       playAlarm();
  //       await handleButtonClick("muse2");
  //     }
  //   };
  //   executeActions();
  // }, [isDrowsy, isDrowsyByServer, playAlarm, handleButtonClick]);

  // 서버에서 drowsy 상태 가져오기
  useEffect(() => {
    const fetchDrowsyStatus = async () => {
      try {
        const response = await axios.get("/consume");
        if (
          response.data.status === "drowsy" &&
          response.data.data.drowsy === "1"
        ) {
          console.log("서버로부터 졸음 상태 감지:", response.data);
          setIsDrowsyByServer(true);
          playAlarm(); // 졸음 상태에서 알람 소리 재생
          handleButtonClick("muse2");
        } else {
          setIsDrowsyByServer(false); // 졸음 상태가 아니라면 상태 초기화
        }
      } catch (error) {
        console.error("서버 요청 실패:", error);
      }
    };

    const interval = setInterval(fetchDrowsyStatus, 5000); // 5초마다 요청
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 클리어
  }, []);

  // useEffect(() => {
  //   if (isDrowsyByEAR) {
  //     console.log("EAR 상태:", isDrowsyByEAR);
  //   }
  //   if (isYawning) {
  //     console.log("하품 상태:", isYawning);
  //   }
  //   if (isDrowsyByPERCLOS) {
  //     console.log("PERCLOS 상태:", isDrowsyByPERCLOS);
  //   }
  // }, [isDrowsyByEAR, isYawning, isDrowsyByPERCLOS]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const recentBlinks = blinkTimestamps.filter(
        (timestamp) => currentTime - timestamp < BLINK_TIME_WINDOW
      );
      setBlinkTimestamps(recentBlinks);
      if (recentBlinks.length < NORMAL_BLINK_RATE) {
        // setIsBlinkFrequencyLow(true);
      } else {
        // setIsBlinkFrequencyLow(false);
      }
    }, BLINK_TIME_WINDOW);

    return () => clearInterval(interval);
  }, [blinkTimestamps]);
  // function handleBlink() {
  //   setBlinkTimestamps((prev) => [...prev, Date.now()]);
  // }

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    function updateBlinkStatus(ear: number) {
      const currentTime = Date.now();
      if (ear < EAR_THRESHOLD) {
        closedEyeTime += currentTime - lastBlinkTime;
        if (closedEyeTime > CLOSED_EYE_THRESHOLD) {
          setIsLongEyeClosureDetected(true);
        } else {
          setIsLongEyeClosureDetected(false);
        }
      } else {
        if (closedEyeTime > 0) {
          blinkCounter += 1;
          closedEyeTime = 0;
        }
      }
      lastBlinkTime = currentTime;
      // if (blinkCounter < BLINK_THRESHOLD && blinkCounter > 0) {
      //   // console.log("깜빡임 빈도 감소 감지!");
      //   setIsBlinkFrequencyLow(true);
      // } else {
      //   setIsBlinkFrequencyLow(false);
      // }
    }

    const EAR_THRESHOLD = 0.2;
    const EAR_CONSEC_FRAMES = 15;
    const MAR_THRESHOLD = 0.5;
    const YAWN_CONSEC_FRAMES = 15;
    const DROWSINESS_ALERT_INTERVAL = 10 * 1000;
    const PERCLOS_WINDOW = 4 * 1000;
    const PERCLOS_THRESHOLD = 0.7;

    let blinkCounter = 0;
    let yawnCounter = 0;
    let lastAlertTime = 0;
    let perclosStartTime = Date.now();
    let closedEyeFrames = 0;
    let totalFrames = 0;
    let closedEyeTime = 0;
    let lastBlinkTime = Date.now();
    // const BLINK_THRESHOLD = 5;
    const CLOSED_EYE_THRESHOLD = 2000;

    const calculateMouthAspectRatio = (landmarks: any) => {
      const topLip = landmarks[13];
      const bottomLip = landmarks[14];
      const leftLip = landmarks[78];
      const rightLip = landmarks[308];

      const verticalDistance = Math.sqrt(
        Math.pow(topLip.x - bottomLip.x, 2) +
          Math.pow(topLip.y - bottomLip.y, 2)
      );
      const horizontalDistance = Math.sqrt(
        Math.pow(leftLip.x - rightLip.x, 2) +
          Math.pow(leftLip.y - rightLip.y, 2)
      );

      return verticalDistance / horizontalDistance; // MAR 계산 공식
    };

    faceMesh.onResults((results) => {
      if (!isCameraOn) {
        return;
      }
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];

        if (canvasRef.current) {
          const canvasCtx = canvasRef.current.getContext("2d");

          if (canvasCtx) {
            // 캔버스 해상도 및 크기 조정
            canvasRef.current.width = 1280;
            canvasRef.current.height = 960;
            canvasCtx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            canvasCtx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            canvasCtx.drawImage(
              videoRef.current!,
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            // 눈 랜드마크 그리기
            canvasCtx.fillStyle = "blue";
            const drawLandmarks = (eyeLandmarks: any) => {
              eyeLandmarks.forEach((landmark: any) => {
                canvasCtx.beginPath();
                canvasCtx.arc(
                  landmark.x * canvasRef.current!.width,
                  landmark.y * canvasRef.current!.height,
                  5,
                  0,
                  2 * Math.PI
                );
                canvasCtx.fill();
              });
            };
            const leftEye = [
              landmarks[33],
              landmarks[160],
              landmarks[158],
              landmarks[133],
              landmarks[153],
              landmarks[144],
            ];
            const rightEye = [
              landmarks[362],
              landmarks[385],
              landmarks[387],
              landmarks[263],
              landmarks[373],
              landmarks[380],
            ];
            drawLandmarks(leftEye);
            drawLandmarks(rightEye);
            // 입술 랜드마크 그리기
            canvasCtx.fillStyle = "orange";
            const mouthLandmarks = [
              landmarks[13],
              landmarks[14],
              landmarks[78],
              landmarks[308],
            ];
            mouthLandmarks.forEach((landmark: any) => {
              canvasCtx.beginPath();
              canvasCtx.arc(
                landmark.x * canvasRef.current!.width,
                landmark.y * canvasRef.current!.height,
                5,
                0,
                2 * Math.PI
              );
              canvasCtx.fill();
            });
          }
        }
        // 눈 좌표 추출
        const leftEye = [
          landmarks[33],
          landmarks[160],
          landmarks[158],
          landmarks[133],
          landmarks[153],
          landmarks[144],
        ];
        const rightEye = [
          landmarks[362],
          landmarks[385],
          landmarks[387],
          landmarks[263],
          landmarks[373],
          landmarks[380],
        ];

        // EAR 계산 함수
        const calculateEAR = (eyeLandmarks: any) => {
          const A = Math.sqrt(
            Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) +
              Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2)
          );
          const B = Math.sqrt(
            Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) +
              Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2)
          );
          const C = Math.sqrt(
            Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) +
              Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2)
          );
          return (A + B) / (2.0 * C); // EAR 계산 공식
        };
        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);
        const averageEAR = (leftEAR + rightEAR) / 2.0;

        // console.log("EAR:", averageEAR);
        // PERCLOS 계산
        totalFrames += 1;
        if (averageEAR < EAR_THRESHOLD) {
          closedEyeFrames += 1;
        }
        const currentTime = Date.now();
        if (currentTime - perclosStartTime >= PERCLOS_WINDOW) {
          const perclos = closedEyeFrames / totalFrames;
          // console.log("PERCLOS:", perclos);
          if (perclos > PERCLOS_THRESHOLD) {
            setIsDrowsyByPERCLOS(true);
            // alert("졸음이 감지되었습니다! 잠시 휴식을 취하세요. by PERCLOS");
            console.log(
              "졸음이 감지되었습니다! 잠시 휴식을 취하세요. by PERCLOS"
            );
            playAlarm();
            handleButtonClick("camera");
            lastAlertTime = currentTime;
          } else {
            setIsDrowsyByPERCLOS(false);
          }
          // PERCLOS 계산 초기화
          perclosStartTime = currentTime;
          closedEyeFrames = 0;
          totalFrames = 0;
        }

        // EAR 졸음 감지 로직
        let isDrowsy = false;
        if (averageEAR < EAR_THRESHOLD) {
          blinkCounter += 1;
          setIsDrowsyByEAR(true);
        } else {
          blinkCounter = 0;
          setIsDrowsyByEAR(false);
        }

        // MAR 계산 및 하품 감지 로직
        const mar = calculateMouthAspectRatio(landmarks);
        if (mar > MAR_THRESHOLD) {
          yawnCounter += 1;
          setIsYawning(true);
        } else {
          yawnCounter = 0;
          setIsYawning(false);
        }
        if (
          blinkCounter >= EAR_CONSEC_FRAMES ||
          yawnCounter >= YAWN_CONSEC_FRAMES
        ) {
          isDrowsy = true;
        }
        if (
          isDrowsy &&
          currentTime - lastAlertTime > DROWSINESS_ALERT_INTERVAL
        ) {
          // alert("졸음이 감지되었습니다! 잠시 휴식을 취하세요. by EAR and yawn");
          console.log(
            "졸음이 감지되었습니다! 잠시 휴식을 취하세요. by EAR and yawn"
          );
          playAlarm();
          handleButtonClick("camera");
          lastAlertTime = currentTime;
        } else {
        }
        updateBlinkStatus(averageEAR);
      }
    });

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  return (
    <>
      <Header />
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          display: isCameraOn ? "block" : "none",
          width: "100%",
          height: "140%",
        }}
      />
      <div className={styles.statusContainer}>
        <div className={styles.sensorData}>
          현재 상태 : {sensorData}
          {isDrowsy ? (
            <span className={styles.status}> 졸음 상태 감지!</span>
          ) : isYawning ? (
            <span className={styles.status}> (하품 감지! MAR)</span>
          ) : isLongEyeClosureDetected ? (
            <span className={styles.status}>(장시간 눈 감음 감지! by EAR)</span>
          ) : isDrowsyByServer ? (
            <span className={styles.status}> (서버에서 졸음 상태 감지!)</span>
          ) : null}
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={toggleCamera}>
          {isCameraOn ? "카메라 끄기" : "카메라 켜기"}
        </button>
        <button className={styles.button} onClick={() => handleButtonClick()}>
          아두이노 실행
        </button>
        <button
          className={styles.button}
          onClick={() => handleButtonClick("camera")}
        >
          영상에서 졸음 감지 시 노란색 LED 켜기
        </button>
        <button
          className={styles.button}
          onClick={() => handleButtonClick("muse2")}
        >
          MUSE2에서 졸음 감지 시 파란색 LED 켜기
        </button>
      </div>
    </>
  );
};

export default DrowsinessDetector;
