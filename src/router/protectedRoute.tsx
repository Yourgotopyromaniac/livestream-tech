import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";

const ProtectedRoute: React.FC<{ children: any }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const accessToken = Cookies.get("cvAdminAccess");

  const checkUser = () => {
    if (!accessToken) {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      // Fetch admin profile and store in zustand
    }
  };

  useEffect(() => {
    checkUser();
  }, [isLoggedIn]);

  return <>{isLoggedIn ? children : null}</>;
};

export { ProtectedRoute };
