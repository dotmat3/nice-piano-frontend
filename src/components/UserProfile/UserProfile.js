import React, { useMemo } from "react";

import { generateColor } from "../../utils";

import "./UserProfile.scss";

const UserProfile = ({ username }) => {
  const color = useMemo(() => "#" + generateColor(username), [username]);

  return (
    <div className="user-profile" style={{ backgroundColor: color }}>
      <p>{username[0]}</p>
    </div>
  );
};

export default UserProfile;
