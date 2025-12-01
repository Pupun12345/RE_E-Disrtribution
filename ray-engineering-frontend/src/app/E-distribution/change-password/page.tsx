"use client";

import { useEffect, useState } from "react";

export default function ChangePasswordPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const TOKEN =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetch("http://localhost:4000/api/users", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched Users:", data);
        setUsers(data.users || []);
      })
      .catch((err) => console.log("Error fetching users:", err));
  }, []);

  const handleChangePassword = async () => {
    if (!selectedUser) return alert("Please select a user");

    if (newPassword.length < 6)
      return alert("Password must be at least 6 characters");

    if (newPassword !== confirmPassword) return alert("Passwords do not match");

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:4000/api/users/change-password/${selectedUser}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setSelectedUser("");
      } else {
        alert(data.message || "Error updating password");
      }
    } catch (error) {
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "500px",
        margin: "auto",
        marginTop: "30px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
        color: "#000",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#000" }}>
        Change User Password
      </h2>

      {/* User Dropdown */}
      <label style={{ color: "#000" }}>Select User</label>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          color: "#000",
        }}
      >
        <option value="">-- Select User --</option>
        {users.map((u) => (
          <option key={u._id} value={u._id} style={{ color: "#000" }}>
            {u.firstname} {u.lastname} ({u.email}) — {u.role}
          </option>
        ))}
      </select>

      {/* New Password */}
      <label style={{ color: "#000" }}>New Password</label>
      <div style={{ position: "relative", marginBottom: "15px" }}>
        <input
          type={showNewPass ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          style={{
            width: "100%",
            padding: "10px 40px 10px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            color: "#000",
          }}
        />
        {/* Eye Button */}
        <span
          onClick={() => setShowNewPass(!showNewPass)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#555",
            fontSize: "18px",
          }}
        >
          {showNewPass ? "👁️" : "👁️‍🗨️"}
        </span>
      </div>

      {/* Confirm Password */}
      <label style={{ color: "#000" }}>Confirm Password</label>
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <input
          type={showConfirmPass ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          style={{
            width: "100%",
            padding: "10px 40px 10px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            color: "#000",
          }}
        />
        {/* Eye Button */}
        <span
          onClick={() => setShowConfirmPass(!showConfirmPass)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#555",
            fontSize: "18px",
          }}
        >
          {showConfirmPass ? "👁️" : "👁️‍🗨️"}
        </span>
      </div>

      <button
        onClick={handleChangePassword}
        disabled={loading}
        style={{
          width: "100%",
          background: "#0070f3",
          padding: "12px",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "16px",
          cursor: "pointer",
          border: "none",
        }}
      >
        {loading ? "Updating..." : "Change Password"}
      </button>
    </div>
  );
}
