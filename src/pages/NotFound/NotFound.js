import React from "react";

import { ReactComponent as NotFoundSVG } from "./assets/404.svg";

import "./NotFound.scss";

const NotFound = () => {
  return (
    <div className="not-found">
      <h1>
        Seems like this page
        <br />
        was taken by an UFO
      </h1>
      <NotFoundSVG />
    </div>
  );
};

export default NotFound;
