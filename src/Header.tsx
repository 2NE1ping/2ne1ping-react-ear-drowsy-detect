import React, { useState } from "react";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>Watch? Wake!</div>
    </header>
  );
};

export default Header;
