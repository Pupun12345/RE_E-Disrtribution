"use client";
import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import "./VendorRegistration.css";
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

  const url = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${url}/api/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // ✅ include token
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
    <div className="vendor-page">
      <div className="vendor-container">
        <div className="vendor-header">
          <h1 className="vendor-title">Vendor Registration</h1>
          <Link
            href={all_routes.VendorGateway}
            className="edit-icon-link"
            title="Go to Vendor Gateway"
          >
            <FaEdit className="edit-icon" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="vendor-form">
          <div className="form-group">
            <label>Party Name</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleChange}
              placeholder="Enter Party Name"
              required
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter Address"
              required
            />
          </div>

          <div className="form-group">
            <label>GST Number</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST Number"
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Enter Contact Number"
              required
            />
          </div>

          <div className="form-submit">
            <button type="submit" className="neon-button" disabled={loading}>
              {loading ? "Registering..." : "Register Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
