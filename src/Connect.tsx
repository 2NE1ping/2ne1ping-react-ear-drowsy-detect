import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Settings {
  A: string;
  B: string;
}

const Connect: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<string>("Initializing connection...");
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const maxAttempts = 60;
    let attempts = 0;

    const fetchMessages = async () => {
      if (!isMounted || isConnected) return;

      try {
        attempts++;
        setStatus("Connecting to server...");
        setIsLoading(true);

        const response = await axios.get(`/consume`);
        const { status, data } = response.data;

        if (
          status === "두 개의 메시지가 도착했습니다" ||
          status === "connection"
        ) {
          setSettings(data);
          setIsConnected(true);
          setIsLoading(false);
          return;
        } else {
          setStatus(status);
          setIsConnected(false);
        }
      } catch (error: any) {
        if (isMounted) {
          setError("Failed to fetch messages from the server.");
          setIsConnected(false);
          setIsLoading(false);
        }
      }

      if (attempts >= maxAttempts && isMounted) {
        setError("Timeout: No response from server after 1 minute.");
        setIsConnected(false);
        setIsLoading(false);
      } else if (isMounted) {
        setTimeout(fetchMessages, 1000);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [isConnected]);

  const handleDetectClick = () => {
    navigate("/detect");
  };

  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.header}>기기 연결 페이지</h1>

      {error ? (
        <div style={styles.errorContainer}>
          <h2 style={styles.errorMessage}>서버 연결 실패</h2>
          <p>{error}</p>
        </div>
      ) : isLoading ? (
        <div style={styles.loadingContainer}>
          <div className="spinner" style={styles.spinner}></div>
          <p style={styles.loadingText}>{status}</p>
        </div>
      ) : (
        <div>
          {isConnected ? (
            <div style={styles.successContainer}>
              <h2 style={styles.successMessage}>기기 연결에 성공했습니다!</h2>
              {/* <div style={styles.messageContainer}>
                <p>Source A: {settings?.A}</p>
                <p>Source B: {settings?.B}</p>
              </div> */}
              <button onClick={handleDetectClick} style={styles.detectButton}>
                인식하기
              </button>
            </div>
          ) : (
            <div style={styles.waitingContainer}>
              <h2 style={styles.waitingMessage}>{status}</h2>
              <h2 style={styles.successMessage}>기기 연결에 실패했습니다...</h2>
              {!settings && <p>Waiting for messages...</p>}
              <button
                onClick={handleDetectClick}
                style={styles.detectButton}
                disabled
              >
                인식하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Connect;

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    textAlign: "center" as "center",
    padding: "20px",
  },
  header: {
    fontSize: "2rem",
    marginBottom: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: "1.2rem",
    marginTop: "10px",
    color: "#555",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #ccc",
    borderTop: "4px solid #007BFF",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    color: "red",
    padding: "10px",
    border: "1px solid red",
    borderRadius: "5px",
  },
  errorMessage: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  successContainer: {
    color: "green",
    padding: "10px",
    border: "1px solid green",
    borderRadius: "5px",
  },
  successMessage: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  messageContainer: {
    marginTop: "10px",
    fontSize: "1.2rem",
  },
  waitingContainer: {
    color: "orange",
    padding: "10px",
    border: "1px solid orange",
    borderRadius: "5px",
  },
  waitingMessage: {
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  detectButton: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "1rem",
    color: "#fff",
    backgroundColor: "#007BFF",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

const spinnerCSS = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = spinnerCSS;
document.head.appendChild(styleSheet);
