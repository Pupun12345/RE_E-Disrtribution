"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./RegistrationForm.module.css";

export default function ItemEntryForm() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ItemEntryFormPage />
    </ProtectedRoute>
  );
}

function ItemEntryFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    itemName: "",
    unit: "",
    customUnit: "",
  });
  const [items, setItems] = useState<{ itemName: string; unit: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState("");

  // Load existing items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await api.get("/api/items");
        setItems(res);
      } catch (err) {
        console.error("Error loading items:", err);
      }
    };
    loadItems();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUnit =
      formData.unit === "Others (Custom)" ? formData.customUnit : formData.unit;

    if (!formData.itemName || !finalUnit) {
      alert("⚠️ Please enter item name and select a unit.");
      return;
    }

    try {
      const res = await api.post("/api/items", {
        itemName: formData.itemName,
        unit: finalUnit,
      });

      if (res.success) {
        setItems((prev) => [...prev, res.item]);
        setFormData({ itemName: "", unit: "", customUnit: "" });
        setSelectedItem("");
        alert(`✅ "${res.item.itemName}" added successfully!`);
      }
    } catch (err: any) {
      alert("❌ " + (err.message || "Error saving item"));
    }
  };

  // Go back
  const handleBack = () => router.back();

  return (
    <div className={styles.formContainer}>
      <h1>Item Entry Form</h1>

      <form onSubmit={handleSubmit}>
        {/* Item Name */}
        <label htmlFor="itemName">Item Name:</label>
        <input
          type="text"
          id="itemName"
          name="itemName"
          placeholder="Enter item name"
          value={formData.itemName}
          onChange={handleChange}
          required
        />

        {/* Unit */}
        <label htmlFor="unit">Unit:</label>
        <select
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          required
        >
          <option value="">Select a unit</option>
          <option value="Pieces">Pieces</option>
          <option value="Pairs">Pairs</option>
          <option value="Kg">Kg</option>
          <option value="Liters">Liters</option>
          <option value="Others (Custom)">Others (Custom)</option>
        </select>

        {/* Custom Unit */}
        {formData.unit === "Others (Custom)" && (
          <div className={styles.customField}>
            <label htmlFor="customUnit">Enter Custom Unit:</label>
            <input
              type="text"
              id="customUnit"
              name="customUnit"
              placeholder="Enter your custom unit"
              value={formData.customUnit}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <button type="submit" className={styles.addBtn}>
          Submit
        </button>
      </form>

      <div className={styles.backSection}>
        <button onClick={handleBack} className={styles.backBtn}>
          Back
        </button>
      </div>
    </div>
  );
}
