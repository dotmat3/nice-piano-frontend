import React from "react";
import { Link } from "react-router-dom";

import Logo from "../Logo";

import "./Header.scss";

const Header = () => {
  return (
    <header>
      <Logo />
      <div className="menu">
        <ul>
          <Link to="/">
            <li>Home</li>
          </Link>
          <Link to="/#about">
            <li>About</li>
          </Link>
          <Link to="/signin">
            <li className="highlight">Sign in</li>
          </Link>
        </ul>
      </div>
    </header>
  );
};

export default Header;
