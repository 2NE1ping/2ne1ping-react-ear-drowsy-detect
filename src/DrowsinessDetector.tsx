import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";

const DrowsinessDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrowsy, setIsDrowsy] = useState(false);

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

    const EAR_THRESHOLD = 0.2; // EAR 값이 이 이하일 경우 -> 졸음으로 판단
    const EAR_CONSEC_FRAMES = 15; // EAR 값이 낮은 상태로 유지되어야 하는 프레임 수

    let blinkCounter = 0;

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];

        // 캔버스에 눈 랜드마크 그리기
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

            drawLandmarks([
              landmarks[33],
              landmarks[160],
              landmarks[158],
              landmarks[133],
              landmarks[153],
              landmarks[144],
            ]);
            drawLandmarks([
              landmarks[362],
              landmarks[385],
              landmarks[387],
              landmarks[263],
              landmarks[373],
              landmarks[380],
            ]);
          }
        }

        // 눈 좌표 추출
        const leftEye = [
          landmarks[33], // 외측
          landmarks[160], // 상측
          landmarks[158], // 하측
          landmarks[133], // 내측
          landmarks[153], // 상측
          landmarks[144],
        ];
        const rightEye = [
          landmarks[362], // 외측
          landmarks[385], // 상측
          landmarks[387], // 하측
          landmarks[263], // 내측
          landmarks[373], // 상측
          landmarks[380], // 하측
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
        if (averageEAR < EAR_THRESHOLD) {
          blinkCounter += 1;
          console.log("blinkCounter:", blinkCounter);
          if (blinkCounter >= EAR_CONSEC_FRAMES) {
            setIsDrowsy(true);
          }
        } else {
          blinkCounter = 0;
          console.log("blinkCounter reset:", blinkCounter);
          setIsDrowsy(false);
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
      {isDrowsy && (
        <div
          style={{
            color: "red",
            fontSize: "24px",
            position: "absolute",
            top: "10px",
            left: "10px",
          }}
        >
          졸음 감지!
        </div>
      )}
    </>
  );
};

export default DrowsinessDetector;
