import React from "react";

import "./Section.scss";

const Section = ({ children, ...props }) => {
  return (
    <div {...props} className={"section " + props.className}>
      {children}
    </div>
  );
};

export default Section;
