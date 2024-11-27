import React from "react";
import { Link } from "react-router-dom";
import Logo from "./assets/AppLogo.png";

const Home: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <img
        src={Logo}
        alt="App Logo"
        style={{ width: "150px", marginBottom: "20px" }}
      />
      <h1>메인페이지</h1>
      <Link to="/connect">
        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#007BFF",
            color: "white",
          }}
        >
          연결하기
        </button>
      </Link>
    </div>
  );
};

export default Home;
