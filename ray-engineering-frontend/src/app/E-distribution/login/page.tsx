"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { FaUser, FaLock, FaSyncAlt, FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginResponse {
  success?: boolean;
  token?: string;
  role?: string;
  username?: string;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("9K7RFP");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const url = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Refresh captcha
  const refreshCaptcha = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCaptcha(random);
    setCaptcha("");
    setError("");
  };

  // ✅ Handle login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (captcha.trim() !== generatedCaptcha) {
      setError("❌ Invalid Captcha. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${url}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }

      // ✅ Store user info
      localStorage.setItem("token", data.token || "");
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("username", data.username || email);

      // ✅ Redirect after login
      router.push("/E-distribution/dashboard");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}></div>

      <div className={styles.loginBox}>
        <h2 className={styles.title}>e.PROCUREMENT</h2>
        <p className={styles.subtitle}>Welcome back! Please sign in</p>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <FaUser className={styles.icon} />
            <input
              type="email"
              placeholder="Username / Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* ✅ Password with Eye Toggle */}
          <div className={styles.inputGroup}>
            <FaLock className={styles.icon} />
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* ✅ Captcha Section */}
          <div className={styles.captchaRow}>
            <div className={styles.captchaBox}>{generatedCaptcha}</div>
            <button
              type="button"
              onClick={refreshCaptcha}
              className={styles.refreshBtn}
              aria-label="Refresh Captcha"
            >
              <FaSyncAlt />
            </button>
            <input
              type="text"
              placeholder="Enter Captcha"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              required
              className={styles.captchaInput}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <a href="#">Forgot User ID?</a>
          <a href="#">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
