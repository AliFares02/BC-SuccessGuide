import { API_BASE_URL } from "../api/config";
import axios from "axios";
import React, { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  async function handlePasswordReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (password !== confirmPassword) {
      setError("Passwords don't match");
    } else {
      axios
        .post(`${API_BASE_URL}/api/users/reset-password/${token}`, {
          newPassword: password,
        })
        .then((response) => {
          toast.success(response.data.msg);
          setError(null);
          setLoading(false);
          navigate("/authenticate");
        })
        .catch((error) => {
          setLoading(false);
          setError(error?.response?.data?.msg);
        });
    }
  }
  return (
    <div className="reset-password-container">
      <h1 className="reset-password-page-main-logo">BC SuccessGuide</h1>
      <div className="reset-password-form-wrapper">
        <form className="reset-password-form" onSubmit={handlePasswordReset}>
          <h2>Reset password</h2>
          <label htmlFor="password">New password</label>

          <div className="input-div">
            <input
              type={showPwd ? "text" : "password"}
              id="password"
              className="reset-pwd"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {showPwd ? (
              <IoMdEye
                className="password-toggle"
                onClick={() => setShowPwd(false)}
              />
            ) : (
              <IoMdEyeOff
                className="password-toggle"
                onClick={() => setShowPwd(true)}
              />
            )}
          </div>
          <label htmlFor="reset-pwd">Confirm new password</label>
          <div className="input-div">
            <input
              type={showConfirmPwd ? "text" : "password"}
              id="confirm-reset-pwd"
              className="confirm-reset-pwd"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {showConfirmPwd ? (
              <IoMdEye
                className="password-toggle"
                onClick={() => setShowConfirmPwd(false)}
              />
            ) : (
              <IoMdEyeOff
                className="password-toggle"
                onClick={() => setShowConfirmPwd(true)}
              />
            )}
          </div>

          {error && <div className="error">{error}</div>}
          <button
            disabled={!password || loading}
            type="submit"
            className="confirm-reset-pwd-btn"
          >
            {loading ? <CgSpinner className="spinner" /> : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
