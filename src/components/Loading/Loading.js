import React, { useEffect, useState } from "react";
import Logo from "../Logo";

import "./Loading.scss";

const ProgressBar = ({ value }) => {
  return (
    <div className="progress-bar">
      <div
        className="progress-bar__active"
        style={{ width: value + "%" }}
      ></div>
    </div>
  );
};

const Loading = ({ progress }) => {
  const [text, setText] = useState("Loading");

  useEffect(() => {
    const interval = setInterval(() => {
      if ((text.match(/\./g) || []).length >= 3)
        setText(text.substr(0, text.length - 3));
      else setText(text + ".");
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div className="loading">
      <Logo />
      <h1>{text}</h1>
      {!!progress && <ProgressBar value={progress} />}
    </div>
  );
};

export default Loading;
