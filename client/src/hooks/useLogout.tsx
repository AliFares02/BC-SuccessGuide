import React from "react";
import useAuthContext from "./useAuthContext";
import { useNavigate } from "react-router-dom";

function useLogout() {
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("access");
    dispatch({ type: "LOGOUT" });
    navigate("/authenticate");
  }
  return { logout };
}

export default useLogout;
