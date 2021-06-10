import React from "react";

import { Link } from "react-router-dom";

import { ReactComponent as LogoSVG } from "./assets/logo.svg";

const Logo = () => {
  return (
    <Link to="/">
      <div className="logo">
        <LogoSVG />
      </div>
    </Link>
  );
};

export default Logo;
