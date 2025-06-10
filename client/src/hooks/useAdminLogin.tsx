import { API_BASE_URL } from "../api/config";
import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import useAuthContext from "./useAuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type LoginObject = {
  email: string;
  password: string;
};

type JwtPayload = {
  _id: string;
  email: string;
  role: string;
  department: string;
};

function useAdminLogin() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const { dispatch } = useAuthContext();

  const navigate = useNavigate();

  async function login(loginValues: LoginObject) {
    setLoginError(null);
    setLoginLoading(true);
    const { email, password } = loginValues;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError("Missing fields");
      setLoginLoading(false);
    } else {
      axios
        .post(`${API_BASE_URL}/api/admin/login`, {
          email: trimmedEmail,
          password: trimmedPassword,
        })
        .then((response) => {
          localStorage.setItem("access", response?.data?.access_token);
          const { _id, email, role, department } = jwtDecode<JwtPayload>(
            response?.data?.access_token
          );
          dispatch({
            type: "LOGIN",
            payload: {
              access: response?.data?.access_token,
              _id,
              email,
              role,
              department,
            },
          });
          navigate("/admin");
        })
        .catch((error) => setLoginError(error?.response?.data?.msg))
        .finally(() => setLoginLoading(false));
    }
  }
  return { login, loginError, setLoginError, loginLoading };
}

export default useAdminLogin;
