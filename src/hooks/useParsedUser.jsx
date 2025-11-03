import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";

const useParsedUser = () => {
  const [parsedUserData, setParsedUserData] = useState({});

  const parseUserCookie = () => {
    try {
      const user = Cookies.get("user");
      if (user) {
        const parsed = JSON.parse(user);
        // Handle Sequelize model structure - might have dataValues
        const userData = parsed.dataValues || parsed;
        return userData || {};
      }
      return {};
    } catch (error) {
      return {};
    }
  };

  useEffect(() => {
    const userData = parseUserCookie();
    setParsedUserData(userData);
  }, []);

  return { parsedUserData };
};

export default useParsedUser;
