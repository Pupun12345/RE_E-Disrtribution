"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/utils/api";
import styles from "./return.module.css";

interface ReturnItem {
  itemName: string;
  qty: string;
  unit: string;
  returnDate: string;
  personName: string;
  location: string;
}

interface SavedItem {
  itemName: string;
  unit: string;
}

interface ReturnRecord {
  _id?: string;
  items: ReturnItem[];
  totalQty: number;
}

export default function ReturnPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("entry");
  const [formData, setFormData] = useState<ReturnItem>({
    itemName: "",
    qty: "",
    unit: "",
    returnDate: "",
    personName: "",
    location: "",
  });
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false); // ✅ added

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  useEffect(() => {
    fetchSavedItems();
    fetchReturns();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const res = await api.get("/api/mechanical/items");
      const itemsArray = Array.isArray(res) ? res : res.items || [];
      setSavedItems(itemsArray);
    } catch (err) {
      console.error("Error fetching items:", err);
      showMessage("⚠️ Failed to fetch item list");
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await api.get("/api/mechanical/returns");
      const list = Array.isArray(res) ? res : res.records || res || [];
      setReturnRecords(list);
    } catch (err) {
      console.error("Error fetching returns:", err);
      showMessage("⚠️ Failed to fetch return records");
    }
  };

  const handleChange = (field: keyof ReturnItem, value: string) => {
    const updated = { ...formData, [field]: value };
    if (field === "itemName") {
      const selected = savedItems.find((s) => s.itemName === value);
      updated.unit = selected ? selected.unit : "";
    }
    setFormData(updated);
  };

  const handleSave = async () => {
    if (!formData.itemName || !formData.qty || !formData.personName) {
      showMessage("⚠️ Please fill required fields");
      return;
    }
    const handleDelete = async (id: string | undefined) => {
      if (!id) return;

      const confirmDelete = confirm(
        "Are you sure you want to delete this return record?"
      );
      if (!confirmDelete) return;

      try {
        const res = await api.delete(`/api/mechanical/returns/${id}`);

        showMessage("🗑️ Return record deleted & stock updated");

        // refresh list
        fetchReturns();
      } catch (err) {
        console.error("Delete error:", err);
        showMessage("❌ Failed to delete record");
      }
    };

    const payload = {
      items: [formData],
      totalQty: Number(formData.qty) || 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/mechanical/returns/${editingId}`, payload);
        showMessage("✅ Return updated successfully");
      } else {
        await api.post("/api/mechanical/returns", payload);
        showMessage("✅ Return saved successfully");
      }

      setFormData({
        itemName: "",
        qty: "",
        unit: "",
        returnDate: "",
        personName: "",
        location: "",
      });
      setEditingId(null);
      fetchReturns();
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save return — check backend connection");
    }
  };

  const handleEdit = (record: ReturnRecord) => {
    setActiveTab("entry");
    if (record.items && record.items.length > 0) {
      setFormData(record.items[0]);
      setEditingId(record._id || null);
      showMessage(" Editing existing record");
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete this return record?"
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/api/mechanical/returns/${id}`);

      showMessage("🗑️ Return record deleted & stock updated");

      // refresh list
      fetchReturns();
    } catch (err) {
      console.error("Delete error:", err);
      showMessage("❌ Failed to delete record");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Mechanical Return Report", 14, 16);
    autoTable(doc, {
      startY: 25,
      head: [["Item Name", "Qty", "Unit", "Return Date", "Person", "Location"]],
      body: filteredRecords.flatMap((r) =>
        r.items.map((i) => [
          i.itemName,
          i.qty,
          i.unit,
          i.returnDate,
          i.personName,
          i.location,
        ])
      ),
    });
    doc.save("Mechanical_Return_Report.pdf");
  };

  // Filtered records based on search and date range
  const filteredRecords = returnRecords.filter((r) =>
    r.items.some((i) => {
      const matchesSearch =
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.personName.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase());

      const matchesFromDate = fromDate ? i.returnDate >= fromDate : true;
      const matchesToDate = toDate ? i.returnDate <= toDate : true;

      return matchesSearch && matchesFromDate && matchesToDate;
    })
  );

  return (
    <div className={styles.container}>
      <div
        className={`${styles.wrapper} ${
          dropdownOpen ? styles.openDropdown : ""
        }`}
      >
        <h1 className={styles.title}>
          <span className={styles.gradient}>MECHANICAL RETURN</span>
        </h1>

        {message && <div className={styles.toast}>{message}</div>}

        {/* Tabs */}
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "entry" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("entry")}
          >
            Entry Form
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "report" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("report")}
          >
            Report
          </button>
        </div>

        {/* Entry Form */}
        {activeTab === "entry" && (
          <div className={styles.formBox}>
            <div className={styles.grid}>
              <select
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
                onFocus={() => setDropdownOpen(true)} // ✅ added
                onBlur={() => setDropdownOpen(false)} // ✅ added
                className={styles.select}
              >
                <option value="">Select Item Name *</option>
                {savedItems.map((item, idx) => (
                  <option key={idx} value={item.itemName}>
                    {item.itemName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Quantity *"
                value={formData.qty}
                onChange={(e) => handleChange("qty", e.target.value)}
                className={styles.input}
              />

              <input
                type="text"
                placeholder="Unit"
                value={formData.unit}
                readOnly
                className={styles.input}
              />
            </div>

            <div className={styles.grid}>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleChange("returnDate", e.target.value)}
                className={styles.input}
              />

              <input
                type="text"
                placeholder="Person Name *"
                value={formData.personName}
                onChange={(e) => handleChange("personName", e.target.value)}
                className={styles.input}
              />

              <input
                type="text"
                placeholder="Location / Site *"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.bottomButtons}>
              <button className={styles.saveButton} onClick={handleSave}>
                💾 {editingId ? "Update Return" : "Save Return"}
              </button>
            </div>
          </div>
        )}

        {/* Report Section */}
        {activeTab === "report" && (
          <div className={styles.reportBox}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <input
                type="text"
                placeholder="🔍 Search Item / Person / Location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  flexGrow: 1,
                  minWidth: "200px",
                }}
              />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  minWidth: "150px",
                }}
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  minWidth: "150px",
                }}
              />

              <button
                onClick={exportPDF}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📄 Download Report
              </button>
            </div>

            <div className={styles.reportScroll}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Return Date</th>
                    <th>Person Name</th>
                    <th>Location / Site</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.flatMap((r) =>
                      r.items.map((i, idx) => (
                        <tr key={r._id + "-" + idx}>
                          <td>{i.itemName}</td>
                          <td>{i.qty}</td>
                          <td>{i.unit}</td>
                          <td>{i.returnDate}</td>
                          <td>{i.personName}</td>
                          <td>{i.location}</td>
                          <td>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEdit(r)}
                            >
                              Edit
                            </button>
                          </td>
                          <td>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDelete(r._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.bottomButtons}>
              <button
                className={styles.saveButton}
                style={{ backgroundColor: "black" }}
                onClick={() => router.back()}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
