import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Connect.module.css";
import Header from "./Header";
import muse2 from "./assets/muse2.png";
import arduino from "./assets/arduino.png";

const Connect: React.FC = () => {
  const [status, setStatus] = useState<string>("Muse2 연결 초기화 중...");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isArduinoConnected, setIsArduinoConnected] = useState<boolean>(false);
  const [arduinoStatus, setArduinoStatus] =
    useState<string>("아두이노 연결 초기화 중...");
  const [isArduinoLoading, setIsArduinoLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  // Muse2 연결 시뮬레이션
  useEffect(() => {
    const connectMuse2 = async () => {
      setStatus("Muse2에 연결 중...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 로딩 시뮬레이션
      setStatus("Muse2 연결 완료!");
      setIsConnected(true);
      setIsLoading(false);
    };

    const connectArduino = async () => {
      setArduinoStatus("아두이노에 연결 중...");
      await new Promise((resolve) => setTimeout(resolve, 4000)); // 4초 로딩 시뮬레이션
      setArduinoStatus("아두이노 연결 완료!");
      setIsArduinoConnected(true);
      setIsArduinoLoading(false);
    };

    // 두 연결을 동시에 시작
    connectMuse2();
    connectArduino();
  }, []);

  const handleDetectClick = () => {
    navigate("/detect");
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.header}>기기 연결</h1>

        <div className={styles.deviceContainer}>
          <h2 className={styles.deviceHeader}>Muse2</h2>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>{status}</p>
            </div>
          ) : (
            <div className={styles.successContainer}>
              <p className={styles.successMessage}>{status}</p>
              <img src={muse2} className={styles.rotatedimage} />
            </div>
          )}
        </div>

        <div className={styles.deviceContainer}>
          <h2 className={styles.deviceHeader}>아두이노</h2>
          {isArduinoLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>{arduinoStatus}</p>
            </div>
          ) : (
            <div className={styles.successContainer}>
              <p className={styles.successMessage}>{arduinoStatus}</p>
              <img src={arduino} className={styles.showimage} />
            </div>
          )}
        </div>

        <div className={styles.actionContainer}>
          <button
            onClick={handleDetectClick}
            className={styles.detectButton}
            disabled={!isConnected || !isArduinoConnected}
          >
            인식하기
          </button>
        </div>
      </div>
    </>
  );
};

export default Connect;
