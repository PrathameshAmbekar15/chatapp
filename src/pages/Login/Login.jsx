import React, { useState } from 'react';
import './Login.css';
import assets from '../../assets/assets';
import { signup, login, resetPassword } from '../../config/firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Handle login/signup form submission
  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currState === "Sign up") {
      signup(username, email, password);
    } else {
      login(email, password);
    }
  };

  // Handle password reset
const onResetHandler = async (e) => {
  e.preventDefault();

  // Close popup immediately and switch to login form
  setShowReset(false);
  setCurrState("Login");
  setResetLoading(true);

  try {
    // Call Firebase reset password
    await resetPassword(resetEmail);
  } catch (error) {
    // Ignore errors and do not show alert
    console.error("Password reset error:", error.message);
  } finally {
    setResetEmail("");
    setResetLoading(false);
    // Always show friendly toast
    toast.success("Check your email to reset password!");
  }
};


  return (
    <div className="login">
      {/* Logo */}
      <img src={assets.logo_big} alt="Logo" className="logo" />

      {/* Password Reset Popup */}
      {showReset && (
        <div className="reset-popup">
          <form className="reset-form" onSubmit={onResetHandler}>
            <h3>Reset Password</h3>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="close-reset" onClick={() => setShowReset(false)}>Cancel</p>
          </form>
        </div>
      )}

      {/* Login / Signup Form */}
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2>

        {currState === "Sign up" && (
          <input
            onChange={(e) => setUserName(e.target.value)}
            value={username}
            type="text"
            placeholder="Username"
            className="form_input"
            required
          />
        )}

        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          placeholder="Email address"
          className="form_input"
          required
        />

        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          placeholder="Password"
          className="form_input"
          required
        />

        <button type="submit">
          {currState === "Sign up" ? "Create account" : "Login now"}
        </button>

        {/* Terms */}
        {currState === "Sign up" && (
          <div className="login-term">
            <input type="checkbox" required />
            <p>Agree to the terms and policy</p>
          </div>
        )}

        {/* Forgot Password */}
        {currState === "Login" && (
          <p className="forgot-text" onClick={() => setShowReset(true)}>
            Forgot Password?
          </p>
        )}

        {/* Toggle Login/Signup */}
        <div className="login-forgot">
          {currState === "Sign up" ? (
            <p className="login-toggle">
              Already have an account?
              <span onClick={() => setCurrState("Login")}> Login here</span>
            </p>
          ) : (
            <p className="login-toggle">
              Create an account
              <span onClick={() => setCurrState("Sign up")}> Click here</span>
            </p>
          )}
        </div>
      </form>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
