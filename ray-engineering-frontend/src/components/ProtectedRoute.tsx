"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  allowedRoles?: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({
  allowedRoles = [],
  children,
}: Props) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // 🚫 No token → not logged in
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      setAuthorized(false);
      setAuthChecked(true);
      setTimeout(() => {
        router.replace("/E-distribution/login"); // ✅ Correct path
      }, 1500);
      return;
    }

    // 🚫 Role not allowed
    if (allowedRoles.length && !allowedRoles.includes(role || "")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      setAuthorized(false);
      setAuthChecked(true);
      setTimeout(() => {
        router.replace("/E-distribution/login"); // ✅ Correct path
      }, 1500);
      return;
    }

    // ✅ Passed authentication & authorization
    setAuthorized(true);
    setAuthChecked(true);
  }, [router, allowedRoles]);

  // ⏳ Loading check
  if (!authChecked)
    return (
      <div
        style={{
          background: "radial-gradient(circle at top, #0a0f1c, #1a2238)",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <h2>Checking authentication...</h2>
      </div>
    );

  // ⚠️ Unauthorized screen
  if (!authorized) {
    return (
      <div
        style={{
          background: "radial-gradient(circle at top, #0a0f1c, #1a2238)",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          fontFamily: "Poppins, sans-serif",
          padding: "20px",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          ⚠️ Unauthorized Access
        </h2>
        <p style={{ fontSize: "1.1rem", color: "#a1a1aa" }}>
          Redirecting to login page...
        </p>
      </div>
    );
  }

  // ✅ Authorized users see content
  return <>{children}</>;
}
