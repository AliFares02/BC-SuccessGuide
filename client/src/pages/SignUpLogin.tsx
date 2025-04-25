import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import useLogIn from "../hooks/useLogIn";
import useSignUp from "../hooks/useSignUp";

function SignUpLogin() {
  const [authenticationOption, setAuthenticationOption] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginValues, setLoginValues] = useState({
    email: "",
    password: "",
  });
  const [signupValues, setSignupValues] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });
  const { signUp, signUpError, setSignUpError, signUpLoading } = useSignUp();
  const { login, loginError, setLoginError, loginLoading } = useLogIn();

  useEffect(() => {
    if (authenticationOption === "login") {
      setSignupValues({ name: "", email: "", password: "", department: "" });
      setSignUpError(null);
    } else {
      setLoginValues({ email: "", password: "" });
      setLoginError(null);
    }
    setShowPassword(false);
  }, [authenticationOption]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await login(loginValues);
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signUp(signupValues);
  }
  return (
    <div className="authenticate-container">
      <h1 className="authentication-page-main-logo">BC SuccessGuide</h1>
      <div className="dynamic-authenticate-container">
        {authenticationOption === "login" ? (
          <form onSubmit={handleLogin} className="authentication-form">
            <h2>Log in</h2>
            <label htmlFor="email">Email</label>
            <div className="input-div">
              <input
                type="email"
                id="email"
                onChange={(e) =>
                  setLoginValues({ ...loginValues, email: e.target.value })
                }
                value={loginValues.email}
              />
            </div>
            <label htmlFor="password">Password</label>
            <div className="input-div">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                onChange={(e) =>
                  setLoginValues({ ...loginValues, password: e.target.value })
                }
                value={loginValues.password}
              />
              {showPassword ? (
                <IoMdEye
                  className="password-toggle"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <IoMdEyeOff
                  className="password-toggle"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
            {loginError && <div className="error">{loginError}</div>}
            <button
              disabled={loginLoading}
              className="authentication-form-btn"
              type="submit"
            >
              {loginLoading ? <CgSpinner className="spinner" /> : "Log in"}
            </button>
            <div>
              <button>Forgot Password?</button>
              <button onClick={() => setAuthenticationOption("register")}>
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="authentication-form">
            <h2>Sign Up</h2>
            <label htmlFor="name">Name</label>
            <div className="input-div">
              <input
                type="text"
                id="name"
                onChange={(e) =>
                  setSignupValues({ ...signupValues, name: e.target.value })
                }
                value={signupValues.name}
              />
            </div>

            <label htmlFor="email">Email</label>
            <div className="input-div">
              <input
                type="text"
                id="email"
                onChange={(e) =>
                  setSignupValues({ ...signupValues, email: e.target.value })
                }
                value={signupValues.email}
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-div">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                onChange={(e) =>
                  setSignupValues({
                    ...signupValues,
                    password: e.target.value,
                  })
                }
                value={signupValues.password}
              />
              {showPassword ? (
                <IoMdEye
                  className="password-toggle"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <IoMdEyeOff
                  className="password-toggle"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>

            <label htmlFor="department">Department</label>
            <div className="input-div">
              <select
                id="department"
                onChange={(e) =>
                  setSignupValues({
                    ...signupValues,
                    department: e.target.value,
                  })
                }
                value={signupValues.department}
              >
                <option value="">Select department</option>
                <option value="Communication">Communication</option>
                <option value="Communication Sciences and Disorders">
                  Communication Sciences and Disorders
                </option>
                <option value="Africana Studies">Africana Studies</option>
              </select>
            </div>
            {signUpError && <div className="error">{signUpError}</div>}
            <button
              disabled={signUpLoading}
              className="authentication-form-btn"
              type="submit"
            >
              {signUpLoading ? <CgSpinner className="spinner" /> : "Sign up"}
            </button>
            <div>
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthenticationOption("login")}
                  className="text-button"
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignUpLogin;
