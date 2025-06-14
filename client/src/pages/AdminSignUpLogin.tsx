import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import useAdminSignUp from "../hooks/useAdminSignUp";
import useAdminLogin from "../hooks/useAdminLogin";
import useAuthContext from "../hooks/useAuthContext";
import UnAuthorizedErrorPage from "./UnAuthorizedErrorPage";
import { Link } from "react-router-dom";

function AdminSignUpLogin() {
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [authenticationOption, setAuthenticationOption] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginValues, setLoginValues] = useState({
    email: "",
    password: "",
  });
  const [signupValues, setSignupValues] = useState({
    email: "",
    password: "",
    department: "",
  });
  const { user } = useAuthContext();
  const { signUp, signUpError, setSignUpError, signUpLoading } =
    useAdminSignUp();
  const { login, loginError, setLoginError, loginLoading } = useAdminLogin();

  useEffect(() => {
    if (authenticationOption === "login") {
      setSignupValues({ email: "", password: "", department: "" });
      setSignUpError(null);
    } else {
      setLoginValues({ email: "", password: "" });
      setLoginError(null);
    }
    setShowPassword(false);
  }, [authenticationOption]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const timeoutId = setTimeout(() => setShowRefreshHint(true), 10000);

    try {
      await login(loginValues);
    } finally {
      clearTimeout(timeoutId);
      setShowRefreshHint(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const timeoutId = setTimeout(() => setShowRefreshHint(true), 10000);

    try {
      await signUp(signupValues);
    } finally {
      clearTimeout(timeoutId);
      setShowRefreshHint(false);
    }
  }
  return (
    <div className="authenticate-container">
      <h1 className="authentication-page-main-logo">BC SuccessGuide</h1>
      <div className="dynamic-authenticate-container">
        {authenticationOption === "login" && user?.role !== "admin" ? (
          <form onSubmit={handleLogin} className="authentication-form">
            <div className={`refresh-hint ${showRefreshHint ? "show" : ""}`}>
              *If the page doesn't load in 30 seconds, try refreshing.
            </div>
            <h2>Admin</h2>
            <h3>Log in</h3>
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
              <Link
                className="request-reset-pwd-link"
                to="/request-reset-password"
              >
                Forgot Password?
              </Link>
              <button onClick={() => setAuthenticationOption("register")}>
                Sign Up
              </button>
            </div>
          </form>
        ) : user && user?.role === "admin" ? (
          <form onSubmit={handleSignup} className="authentication-form">
            <h2>Admin</h2>
            <h3>Sign Up</h3>
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
          </form>
        ) : (
          <UnAuthorizedErrorPage />
        )}
      </div>
    </div>
  );
}

export default AdminSignUpLogin;
