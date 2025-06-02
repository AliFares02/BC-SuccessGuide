function ErrorPage() {
  return (
    <div className="error-page">
      <p
        style={{
          textAlign: "center",
          fontSize: "5rem",
          fontWeight: "500",
          color: "rgb(136, 35, 70)",
          marginBottom: "0",
        }}
      >
        404
      </p>
      <p className="page-title">Page not found</p>
    </div>
  );
}

export default ErrorPage;
