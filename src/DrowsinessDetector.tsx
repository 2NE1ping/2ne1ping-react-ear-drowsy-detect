import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";

const DrowsinessDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrowsyByEAR, setIsDrowsyByEAR] = useState(false);
  const [isYawning, setIsYawning] = useState(false);
  const [isDrowsyByPERCLOS, setIsDrowsyByPERCLOS] = useState(false);
  const [isLongEyeClosureDetected, setIsLongEyeClosureDetected] =
    useState(false);

  const alarmSoundRef = useRef(new Audio("/alert.mp3"));
  const isPlayingRef = useRef(false); // 현재 알람이 재생 중인지 여부를 저장

  useEffect(() => {
    const playAlarmRepeatedly = (repeatCount: number, delay: number) => {
      if (isPlayingRef.current) return; // 이미 재생 중이면 중복 실행 방지
      isPlayingRef.current = true;

      const playSound = (count: number) => {
        if (count <= 0) {
          isPlayingRef.current = false; // 모든 반복 종료 후 상태 초기화
          return;
        }
        alarmSoundRef.current.currentTime = 0;
        alarmSoundRef.current
          .play()
          .then(() => {
            setTimeout(() => playSound(count - 1), delay);
          })
          .catch((error) => {
            console.error("알람 재생 실패:", error);
            isPlayingRef.current = false; // 재생 실패 시 상태 초기화
          });
      };

      playSound(repeatCount);
    };

    // EAR 졸음 감지 알람
    if (isDrowsyByEAR) {
      console.log("EAR 상태: 졸음 감지!");
      playAlarmRepeatedly(3, 1000); // 1초 간격으로 3번 재생
    }

    // 하품 감지 알람
    if (isYawning) {
      console.log("MAR 상태: 하품 감지!");
      playAlarmRepeatedly(3, 1000);
    }

    // PERCLOS 졸음 감지 알람
    if (isDrowsyByPERCLOS) {
      console.log("PERCLOS 상태: 졸음 감지!");
      playAlarmRepeatedly(3, 1000);
    }

    // 장시간 눈 감음 감지
    if (isLongEyeClosureDetected) {
      console.log("장시간 눈 감음 감지!");
      playAlarmRepeatedly(3, 1000);
    }
  }, [isDrowsyByEAR, isYawning, isDrowsyByPERCLOS, isLongEyeClosureDetected]);

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

    const EAR_THRESHOLD = 0.2;
    const EAR_CONSEC_FRAMES = 15;
    const MAR_THRESHOLD = 0.5;
    const PERCLOS_WINDOW = 4 * 1000;
    const PERCLOS_THRESHOLD = 0.7;

    let blinkCounter = 0;
    let yawnCounter = 0;
    let perclosStartTime = Date.now();
    let closedEyeFrames = 0;
    let totalFrames = 0;

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

    const calculateMAR = (landmarks: any) => {
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
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];

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

        const leftEAR = calculateEAR(leftEye);
        const rightEAR = calculateEAR(rightEye);
        const averageEAR = (leftEAR + rightEAR) / 2.0;

        // PERCLOS 계산
        totalFrames += 1;
        if (averageEAR < EAR_THRESHOLD) {
          closedEyeFrames += 1;
        }
        const currentTime = Date.now();
        if (currentTime - perclosStartTime >= PERCLOS_WINDOW) {
          const perclos = closedEyeFrames / totalFrames;
          if (perclos > PERCLOS_THRESHOLD) {
            setIsDrowsyByPERCLOS(true);
          } else {
            setIsDrowsyByPERCLOS(false);
          }
          perclosStartTime = currentTime;
          closedEyeFrames = 0;
          totalFrames = 0;
        }

        // EAR 졸음 감지 로직
        if (averageEAR < EAR_THRESHOLD) {
          blinkCounter += 1;
          setIsDrowsyByEAR(blinkCounter >= EAR_CONSEC_FRAMES);
        } else {
          blinkCounter = 0;
          setIsDrowsyByEAR(false);
        }

        // MAR 계산 및 하품 감지 로직
        const mar = calculateMAR(landmarks);
        if (mar > MAR_THRESHOLD) {
          yawnCounter += 1;
          setIsYawning(yawnCounter >= EAR_CONSEC_FRAMES);
        } else {
          yawnCounter = 0;
          setIsYawning(false);
        }
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

  return (
    <>
      <video ref={videoRef} autoPlay />
      <canvas ref={canvasRef} width={640} height={480} />
      {isDrowsyByEAR && (
        <div
          style={{
            color: "blue",
            fontSize: "24px",
            position: "absolute",
            top: "10px",
            right: "10px",
          }}
        >
          눈 깜빡임 비율 감지! (EAR)
        </div>
      )}
      {isYawning && (
        <div
          style={{
            color: "orange",
            fontSize: "24px",
            position: "absolute",
            top: "50px",
            right: "10px",
          }}
        >
          하품 감지! (MAR)
        </div>
      )}
      {isDrowsyByPERCLOS && (
        <div
          style={{
            color: "red",
            fontSize: "24px",
            position: "absolute",
            top: "90px",
            right: "10px",
          }}
        >
          장시간 눈 감음 감지! (PERCLOS)
        </div>
      )}
    </>
  );
};

export default DrowsinessDetector;
