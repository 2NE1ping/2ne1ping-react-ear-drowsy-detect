import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";

const DrowsinessDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrowsyByEAR, setIsDrowsyByEAR] = useState(false);
  const [isYawning, setIsYawning] = useState(false);

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
    const YAWN_CONSEC_FRAMES = 15;
    const DROWSINESS_ALERT_INTERVAL = 3000;

    let blinkCounter = 0;
    let yawnCounter = 0;
    let lastAlertTime = 0;

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
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];

        if (canvasRef.current) {
          const canvasCtx = canvasRef.current.getContext("2d");
          if (canvasCtx) {
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
                  2,
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
                2,
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

        // 졸음 감지 로직
        const currentTime = Date.now();
        let isDrowsy = false;

        if (averageEAR < EAR_THRESHOLD) {
          blinkCounter += 1;
        } else {
          blinkCounter = 0;
        }

        // MAR 계산 및 하품 감지 로직
        const mar = calculateMouthAspectRatio(landmarks);
        if (mar > MAR_THRESHOLD) {
          yawnCounter += 1;
        } else {
          yawnCounter = 0;
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
          setIsDrowsyByEAR(true);
          alert("졸음이 감지되었습니다! 잠시 휴식을 취하세요.");
          lastAlertTime = currentTime;
        } else {
          setIsDrowsyByEAR(false);
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
      <video ref={videoRef} autoPlay style={{ display: "none" }} />
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
          졸음 감지! (EAR)
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
    </>
  );
};

export default DrowsinessDetector;
