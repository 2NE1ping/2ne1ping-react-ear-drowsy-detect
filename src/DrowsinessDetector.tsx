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
  // const [isBlinkFrequencyLow, setIsBlinkFrequencyLow] = useState(false);
  const [blinkTimestamps, setBlinkTimestamps] = useState<number[]>([]);
  const BLINK_TIME_WINDOW = 10000; // 10초
  const NORMAL_BLINK_RATE = 15; // 예: BLINK_TIME_WINDOW 동안 15회 깜빡임이 정상

  useEffect(() => {
    if (isDrowsyByEAR) {
      console.log("EAR 상태:", isDrowsyByEAR);
    }
    if (isYawning) {
      console.log("하품 상태:", isYawning);
    }
    if (isDrowsyByPERCLOS) {
      console.log("PERCLOS 상태:", isDrowsyByPERCLOS);
    }
  }, [isDrowsyByEAR, isYawning, isDrowsyByPERCLOS]);

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
      {isLongEyeClosureDetected && (
        <div
          style={{
            color: "red",
            fontSize: "24px",
            position: "absolute",
            top: "130px",
            right: "10px",
          }}
        >
          장시간 눈 감음 감지! (by EAR)
        </div>
      )}
      {/* {isBlinkFrequencyLow && (
        <div
          style={{
            color: "purple",
            fontSize: "24px",
            position: "absolute",
            top: "170px",
            right: "10px",
          }}
        >
          깜빡임 빈도 감소 감지! (by EAR)
        </div>
      )} */}
    </>
  );
};

export default DrowsinessDetector;
