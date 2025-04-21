import React from "react";
import useAuthContext from "./useAuthContext";

function useLogout() {
  const { dispatch } = useAuthContext();
  function logout() {
    localStorage.removeItem("access");
    dispatch({ type: "LOGOUT" });
  }
  return { logout };
}

export default useLogout;
