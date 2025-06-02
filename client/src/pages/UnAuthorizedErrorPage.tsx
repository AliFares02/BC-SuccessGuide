import React from "react";

function UnAuthorizedErrorPage() {
  return (
    <div className="un-authorized-error-page">
      <p
        style={{
          textAlign: "center",
          fontSize: "4rem",
          fontWeight: "500",
          color: "rgb(136, 35, 70)",
          marginBottom: "0",
        }}
      >
        403 – Access Denied
      </p>
      <p className="page-title">You don’t have permission to view this page.</p>
    </div>
  );
}

export default UnAuthorizedErrorPage;
