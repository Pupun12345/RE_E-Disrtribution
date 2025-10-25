"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api"; // axios/fetch wrapper
import ProtectedRoute from "@/components/ProtectedRoute"; // ✅ Added
import styles from "./RegistrationForm.module.css";

interface Item {
  itemName: string;
  unit: string;
  customUnit?: string;
}

export default function ItemEntryForm() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ItemEntryFormPage />
    </ProtectedRoute>
  );
}

// ✅ The actual form logic
function ItemEntryFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Item>({
    itemName: "",
    unit: "",
    customUnit: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState("");

  // ✅ Fetch existing items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await api.get("/api/mechanical/items");
        const fetchedItems = res.items || res.data?.items || [];
        if (Array.isArray(fetchedItems)) setItems(fetchedItems);
      } catch (err) {
        console.error("❌ Error loading items:", err);
        alert("⚠️ Failed to load items!");
      }
    };
    loadItems();
  }, []);

  // ✅ Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit new item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUnit =
      formData.unit === "Others (Custom)"
        ? formData.customUnit?.trim()
        : formData.unit;

    if (!formData.itemName || !finalUnit) {
      alert("⚠️ Please enter item name and select a unit.");
      return;
    }

    try {
      const res = await api.post("/api/mechanical/items", {
        itemName: formData.itemName.trim(),
        unit: finalUnit,
      });

      if (res.success && res.item) {
        setItems((prev) => (Array.isArray(prev) ? [...prev, res.item] : [res.item]));
        setFormData({ itemName: "", unit: "", customUnit: "" });
        setSelectedItem("");
        alert(`✅ "${res.item.itemName}" added successfully!`);
      } else {
        alert("⚠️ Unexpected response from server.");
        console.warn("Response:", res);
      }
    } catch (err: any) {
      console.error("❌ Error adding item:", err);
      alert("❌ " + (err.message || "Error saving item"));
    }
  };

  const handleBack = () => router.back();

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.formContainerTitle}>Item Registration</h1>

      <form onSubmit={handleSubmit} className={styles.formElement}>
        {/* Item Name */}
        <label htmlFor="itemName" className={styles.formLabel}>
          Item Name:
        </label>
        <input
          type="text"
          id="itemName"
          name="itemName"
          placeholder="Enter item name"
          value={formData.itemName}
          onChange={handleChange}
          required
          className={styles.formInput}
        />

        {/* Unit Selection */}
        <label htmlFor="unit" className={styles.formLabel}>
          Unit:
        </label>
        <select
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          required
          className={styles.formSelect}
        >
          <option value="">Select unit</option>
          <option value="pcs">pcs</option>
          <option value="pair">pair</option>
          <option value="mtr">mtr</option>
          <option value="Others (Custom)">Others (Custom)</option>
        </select>

        {/* Custom Unit Field */}
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
              className={styles.formInput}
            />
          </div>
        )}

        {/* Add Item Button */}
        <button type="submit" className={styles.addBtn}>
          Add Item
        </button>
      </form>

      {/* Back Button */}
      <div className={styles.backSection}>
        <button onClick={handleBack} className={styles.backBtn}>
          Back
        </button>
      </div>
    </div>
  );
}
