import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";

const useParsedUser = () => {
  const user = Cookies.get("user");

  const [parsedUserData, setParsedUserData] = useState({});

  useEffect(() => {
    if (!user) return;
    setParsedUserData(JSON.parse(user));
  }, [user]);
  return { parsedUserData };
};

export default useParsedUser;
