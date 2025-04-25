import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import useAuthContext from "./useAuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// abstract types to module file and export when needed
type LoginObject = {
  email: string;
  password: string;
};

type JwtPayload = {
  email: string;
  role: string;
  department: string;
};

function useLogIn() {
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
        .post("http://localhost:5000/api/users/login", {
          email: trimmedEmail,
          password: trimmedPassword,
        })
        .then((response) => {
          localStorage.setItem("access", response?.data?.access_token);
          // rest of data returned from server, i.e. department, email, name, will be stored in a separate userContext since they are more related to the user and not the jwt
          // for page refresh, authcontext will grab access from localstorage and userContext will grab access from localstorage as well and decode it to extract name, email, department, from jwt payload.
          const { email, role, department } = jwtDecode<JwtPayload>(
            response?.data?.access_token
          );
          dispatch({
            type: "LOGIN",
            payload: {
              access: response?.data?.access_token,
              email,
              role,
              department,
            },
          });
          navigate("/");
        })
        .catch((error) => setLoginError(error?.response?.data?.msg))
        .finally(() => setLoginLoading(false));
    }
  }
  return { login, loginError, setLoginError, loginLoading };
}

export default useLogIn;
