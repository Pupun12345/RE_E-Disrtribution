"use client";
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./VendorRegistration.module.css";
import { all_routes } from "@/data/allroutes";

interface Vendor {
  partyName: string;
  address: string;
  gstNumber: string;
  contactNumber: string;
}

export default function VendorRegistration() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <VendorRegistrationPage />
    </ProtectedRoute>
  );
}

function VendorRegistrationPage() {
  const [formData, setFormData] = useState<Vendor>({
    partyName: "",
    address: "",
    gstNumber: "",
    contactNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please login again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Failed: ${errorText}`);
        setLoading(false);
        return;
      }

      alert("✅ Vendor Registered Successfully!");
      setFormData({
        partyName: "",
        address: "",
        gstNumber: "",
        contactNumber: "",
      });
    } catch (error) {
      console.error("Vendor registration error:", error);
      alert("❌ Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2 className={styles.title}>Vendor Registration 🧾</h2>
          <Link
            href={all_routes.VendorGateway}
            className={styles.iconLink}
            title="Go to Vendor Gateway"
          >
            <FaEdit className={styles.icon} />
          </Link>
        </div>

        <div className={styles.inputGroup}>
          <label>Party Name</label>
          <input
            type="text"
            name="partyName"
            placeholder="Enter Party Name"
            value={formData.partyName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Address</label>
          <textarea
            name="address"
            placeholder="Enter Full Address"
            rows={3}
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>GST Number</label>
          <input
            type="text"
            name="gstNumber"
            placeholder="Enter GST Number"
            value={formData.gstNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Contact Number</label>
          <input
            type="tel"
            name="contactNumber"
            placeholder="Enter Contact Number"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
