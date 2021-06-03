import React, { useMemo } from "react";

import { generateColor } from "../../utils";

import "./UserProfile.scss";

const UserProfile = ({ username, ...props }) => {
  const color = useMemo(
    () => (username ? "#" + generateColor(username) : "var(--primary)"),
    [username]
  );

  return (
    <div
      {...props}
      className={"user-profile " + props.className}
      style={{ backgroundColor: color, ...props.style }}
    >
      {username && <p>{username[0]}</p>}
    </div>
  );
};

export default UserProfile;
