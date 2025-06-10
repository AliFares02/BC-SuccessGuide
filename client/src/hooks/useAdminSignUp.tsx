import { API_BASE_URL } from "../api/config";
import React from "react";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import useAuthContext from "./useAuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type SignUpObject = {
  email: string;
  password: string;
  department: string;
};

type JwtPayload = {
  _id: string;
  email: string;
  role: string;
  department: string;
};

function useAdminSignUp() {
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const { dispatch } = useAuthContext();
  const { user } = useAuthContext();

  const navigate = useNavigate();

  async function signUp(signUpValues: SignUpObject) {
    setSignUpError(null);
    setSignUpLoading(true);
    const { email, password, department } = signUpValues;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword || !department || department === "") {
      setSignUpError("Missing fields");
      setSignUpLoading(false);
    } else {
      axios
        .post(
          `${API_BASE_URL}/api/admin/sign-up`,
          {
            email: trimmedEmail,
            password: trimmedPassword,
            department,
          },
          {
            headers: {
              Authorization: `Bearer ${user?.access}`,
            },
          }
        )
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
        .catch((error) => setSignUpError(error?.response?.data?.msg))
        .finally(() => {
          setSignUpLoading(false);
        });
    }
  }
  return { signUp, signUpError, setSignUpError, signUpLoading };
}

export default useAdminSignUp;
