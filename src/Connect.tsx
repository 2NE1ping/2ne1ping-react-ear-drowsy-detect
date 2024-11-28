import React from "react";
import { useNavigate } from "react-router-dom";

const Connect: React.FC = () => {
  const navigate = useNavigate();

  const handleDetectClick = () => {
    navigate("/detect");
  };

  return (
    <div className="App" style={styles.container}>
      <button onClick={handleDetectClick} style={styles.detectButton}>
        인식하기
      </button>
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
