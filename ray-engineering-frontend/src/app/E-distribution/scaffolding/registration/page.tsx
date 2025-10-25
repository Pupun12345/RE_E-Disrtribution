"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import ProtectedRoute from "@/components/ProtectedRoute"; // ✅ Added
import styles from "./RegistrationForm.module.css";

interface Item {
  itemName: string;
  puw: string;
  unit: string;
  customUnit?: string;
}

// ✅ Protected wrapper
export default function ProtectedItemEntryForm() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ItemEntryForm />
    </ProtectedRoute>
  );
}

// ✅ Actual form component
function ItemEntryForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<Item>({
    itemName: "",
    puw: "",
    unit: "",
    customUnit: "",
  });
  const [items, setItems] = useState<Item[]>([]);

  // Load scaffolding items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await api.get("/api/scaffolding-items");
        if (res.success) {
          setItems(res.items);
        } else {
          alert("⚠️ Failed to load scaffolding items!");
        }
      } catch (err) {
        console.error("Error loading scaffolding items:", err);
        alert("⚠️ Failed to load scaffolding items!");
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

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUnit =
      formData.unit === "Others (Custom)" ? formData.customUnit?.trim() : formData.unit;

    if (!formData.itemName || !formData.puw || !finalUnit) {
      alert("⚠️ Please fill all fields before submitting.");
      return;
    }

    try {
      const res = await api.post("/api/scaffolding-items", {
        itemName: formData.itemName,
        puw: formData.puw,
        unit: finalUnit,
      });

      if (res.success) {
        setItems((prev) => [...prev, res.item]);
        setFormData({
          itemName: "",
          puw: "",
          unit: "",
          customUnit: "",
        });
        alert(`✅ "${res.item.itemName}" added successfully!`);
      } else {
        alert("❌ Failed to save item. " + (res.message || ""));
      }
    } catch (err: any) {
      alert("❌ " + (err.message || "Error saving item"));
    }
  };

  // Go back
  const handleBack = () => router.back();

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.formElement}>
        <h1 className={styles.formContainerTitle}>Scaffolding Item Registration</h1>

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

        {/* Per Unit Weight */}
        <label htmlFor="puw" className={styles.formLabel}>
          Per Unit Weight (PUW):
        </label>
        <input
          type="text"
          id="puw"
          name="puw"
          placeholder="Enter weight per unit"
          value={formData.puw}
          onChange={handleChange}
          required
          className={styles.formInput}
        />

        {/* Unit */}
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

        {/* Custom Unit */}
        {formData.unit === "Others (Custom)" && (
          <>
            <label htmlFor="customUnit" className={styles.formLabel}>
              Enter Custom Unit:
            </label>
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
          </>
        )}

        <div className={styles.formButtons}>
          <button type="submit" className={styles.addBtn}>
            Item Registration
          </button>
          <button type="button" onClick={handleBack} className={styles.backBtn}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
