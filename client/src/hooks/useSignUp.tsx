import React from "react";
import { useState } from "react";
import useAuthContext from "./useAuthContext";
import axios from "axios";

type SignUpObject = {
  name: string;
  email: string;
  password: string;
  department: string;
};

function useSignUp() {
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const { dispatch } = useAuthContext();

  async function signUp(signUpValues: SignUpObject) {
    setSignUpError(null);
    setSignUpLoading(true);
    const { name, email, password, department } = signUpValues;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedPassword ||
      !department ||
      department === ""
    ) {
      setSignUpError("Missing fields");
      setSignUpLoading(false);
    } else {
      axios
        .post("http://localhost:5000/api/users/sign-up", {
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          department,
        })
        .then((response) => {
          localStorage.setItem("access", response?.data?.access_token);
          dispatch({
            type: "LOGIN",
            payload: {
              access: response?.data?.access_token,
            },
          });
        })
        .catch((error) => setSignUpError(error?.response?.data?.msg))
        .finally(() => {
          setSignUpLoading(false);
        });
    }
  }
  return { signUp, signUpError, signUpLoading };
}

export default useSignUp;
