import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Connect.module.css";
import Header from "./Header";
import muse2 from "./assets/muse2.png";

const Connect: React.FC = () => {
  const [status, setStatus] = useState<string>("Initializing connection...");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    const simulateLoading = async () => {
      setStatus("Connecting to server...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 로딩 시뮬레이션
      setIsConnected(true); // 로딩 완료 후 연결 성공 상태로 변경
      setIsLoading(false); // 로딩 상태 해제
    };

    simulateLoading();
  }, []);

  const handleDetectClick = () => {
    navigate("/detect");
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.header}>기기 연결</h1>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>{status}</p>
          </div>
        ) : (
          <div>
            {isConnected ? (
              <div className={styles.successContainer}>
                <h2 className={styles.successMessage}>
                  기기 연결에 성공했습니다!
                </h2>
                <img src={muse2} className={styles.rotatedimage} />
                <button
                  onClick={handleDetectClick}
                  className={styles.detectButton}
                >
                  인식하기
                </button>
              </div>
            ) : (
              <div className={styles.waitingContainer}>
                <h2 className={styles.waitingMessage}>기기 연결 실패</h2>
                <button
                  onClick={handleDetectClick}
                  className={styles.detectButton}
                  disabled
                >
                  인식하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Connect;
