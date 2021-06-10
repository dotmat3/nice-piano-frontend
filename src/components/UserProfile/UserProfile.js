import React, { useMemo } from "react";

import { generateColor } from "../../utils";

import "./UserProfile.scss";

const UserProfile = ({ username, ...props }) => {
  const color = useMemo(() => {
    if (!username) return "var(--primary)";

    const [h, s, l] = generateColor(username);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [username]);

  return (
    <div
      {...props}
      className={"user-profile " + (props.className ? props.className : "")}
      style={{ backgroundColor: color, ...props.style }}
    >
      {username && <p>{username[0]}</p>}
    </div>
  );
};

export default UserProfile;
