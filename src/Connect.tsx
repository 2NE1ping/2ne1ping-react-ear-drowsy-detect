import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    let isMounted = true;
    const maxAttempts = 60;
    let attempts = 0;

    const fetchMessages = async () => {
      if (!isMounted) return;

      try {
        setStatus("Connecting to server...");
        setIsLoading(true);

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/consume`
        );
        const { status, data } = response.data;

        setStatus(status);
        if (status === "두 개의 메시지가 도착했습니다") {
          setSettings(data);
          setIsConnected(true);
          setIsLoading(false);
          return;
        } else {
          setIsConnected(false);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("Error fetching messages:", error);
          setError("Failed to fetch messages from the server.");
          setIsConnected(false);
          setIsLoading(false);
        }
      }

      attempts++;
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
  }, []);

  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.header}>Kafka Connection Status</h1>

      {error ? (
        <div style={styles.errorContainer}>
          <h2 style={styles.errorMessage}>Error</h2>
          <p>{error}</p>
        </div>
      ) : isLoading ? (
        <div style={styles.loadingContainer}>
          <div className="spinner" style={styles.spinner}></div>
          <p style={styles.loadingText}>Connecting to server...</p>
        </div>
      ) : (
        <div>
          {isConnected ? (
            <div style={styles.successContainer}>
              <h2 style={styles.successMessage}>Connected to Kafka Server</h2>
              <div style={styles.messageContainer}>
                <p>Source A: {settings?.A}</p>
                <p>Source B: {settings?.B}</p>
              </div>
            </div>
          ) : (
            <div style={styles.waitingContainer}>
              <h2 style={styles.waitingMessage}>{status}</h2>
              {!settings && <p>Waiting for messages...</p>}
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
};
