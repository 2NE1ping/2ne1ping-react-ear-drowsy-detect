import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import Logo from "./assets/AppLogo.png";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <img src={Logo} alt="App Logo" className={styles.logo} />
      <h1 className={styles.title}>Watch? Wake!</h1>
      <p className={styles.explain}>
        HCI 개론 (캡스톤디자인) <br /> 이다연 조은채 최현서
      </p>
      <Link to="/connect" className={styles.link}>
        <button className={styles.button}>시작하기</button>
      </Link>
    </div>
  );
};

export default Home;
