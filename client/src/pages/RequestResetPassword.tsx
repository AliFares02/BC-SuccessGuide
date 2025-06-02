import axios from "axios";
import React, { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { toast } from "react-toastify";

function RequestResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    setError(null);
    setLoading(true);
    e.preventDefault();
    axios
      .post("http://localhost:5000/api/users/request-reset-password", {
        email,
      })
      .then((response) => {
        toast.success(`${response.data.msg}, make sure to check spam`);
        setLoading(false);
        setError(null);
      })
      .catch((error) => {
        setLoading(false);
        setError(error?.response?.data?.msg);
      });
  }
  return (
    <div className="request-reset-password-container">
      <h1 className="request-reset-password-page-main-logo">BC SuccessGuide</h1>
      <div className="request-reset-password-form-wrapper">
        <form
          onSubmit={handleResetPassword}
          className="request-reset-password-form"
        >
          <h2>Forgot password</h2>
          <label htmlFor="request-reset-password-email">Enter email</label>
          <input
            id="request-reset-password-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <div className="error">{error}</div>}
          <button
            disabled={!email || loading}
            type="submit"
            className="send-reset-link-btn"
          >
            {loading ? <CgSpinner className="spinner" /> : "Send link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RequestResetPassword;
