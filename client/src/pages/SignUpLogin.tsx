import React from "react";

function SignUpLogin() {
  async function handleSubmit() {}
  return (
    <div className="authenticate-container">
      <form onSubmit={handleSubmit} className="authentication-form">
        <input type="text" placeholder="name" />
        <input type="email" placeholder="email" />
        <input type="password" placeholder="password" />
        <label htmlFor="department">Department</label>
        <select name="department" id="">
          <option value="">Select department</option>
          <option value="">Communication</option>
          <option value="">Communication Sciences & Disorders</option>
          <option value="">Africana Studies</option>
        </select>
      </form>
    </div>
  );
}

export default SignUpLogin;
