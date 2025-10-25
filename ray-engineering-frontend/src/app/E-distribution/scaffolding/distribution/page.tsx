"use client";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import styles from "./distribution.module.css";

// ====================== TYPES ======================
interface Item {
  itemName: string;
  unit: string;
  unitWeight?: number;
}

interface DistributionRecord {
  _id: string;
  woNumber: string;
  location: string;
  tslManager: string;
  supervisorName: string;
  issueDate: string;
  itemName: string;
  unit: string;
  unitWeight: number;
  issuedQuantity: number;
  issuedWeight: number;
}

interface Stock {
  itemName: string;
  qty: number;
}

// ====================== MAIN COMPONENT ======================
export default function DistributionPage() {
  const [activeTab, setActiveTab] = useState<"entry" | "report">("entry");
  const [items, setItems] = useState<Item[]>([]);
  const [records, setRecords] = useState<DistributionRecord[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [editRecord, setEditRecord] = useState<DistributionRecord | null>(null);
  const router = useRouter();

  // ====================== FORM STATE ======================
  const [form, setForm] = useState({
    woNumber: "",
    location: "",
    tslManager: "",
    supervisorName: "",
    issueDate: new Date().toISOString().split("T")[0],
    itemName: "",
    unit: "",
    unitWeight: "",
    issuedQuantity: "",
    issuedWeight: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    from: "",
    to: "",
  });

  // ====================== FETCH DATA ======================
  useEffect(() => {
    fetchItems();
    fetchStock();
    fetchDistributions();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/scaffolding-items");
      setItems(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to load items!");
    }
  };

  const fetchStock = async () => {
    try {
      const res = await api.get("/api/scaffolding-stock");
      setStock(Array.isArray(res.stock) ? res.stock : res);
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to load stock!");
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await api.get("/api/scaffolding-distribution");
      setRecords(Array.isArray(res) ? res : res.distributions || []);
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to load distributions!");
    }
  };

  // ====================== FORM HANDLERS ======================
  const handleChange = (field: string, value: string) => {
    let updatedForm = { ...form, [field]: value };

    if (field === "itemName") {
      const selected = items.find((i) => i.itemName === value);
      updatedForm.unit = selected?.unit || "";
      updatedForm.unitWeight = selected?.unitWeight?.toString() || "";
    }

    if (field === "issuedQuantity" || field === "unitWeight") {
      const uw = parseFloat(updatedForm.unitWeight || "0");
      const qty = parseFloat(updatedForm.issuedQuantity || "0");
      updatedForm.issuedWeight =
        !isNaN(uw) && !isNaN(qty) ? (uw * qty).toFixed(2) : "";
    }

    setForm(updatedForm);
  };

  const validate = () => {
    const { itemName, issuedQuantity, woNumber, tslManager } = form;
    if (!woNumber || !itemName || !issuedQuantity || !tslManager) {
      alert("⚠️ Please fill all required fields.");
      return false;
    }
    const qtyNum = Number(issuedQuantity);
    if (qtyNum <= 0) {
      alert("⚠️ Quantity must be greater than zero.");
      return false;
    }
    const stockItem = stock.find((s) => s.itemName === itemName);
    if ((stockItem?.qty || 0) < qtyNum) {
      alert(`⚠️ Not enough stock. Available: ${stockItem?.qty || 0}`);
      return false;
    }
    return true;
  };

  // ====================== ADD DISTRIBUTION ======================
  const handleAddDistribution = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        issuedQuantity: Number(form.issuedQuantity),
        unitWeight: Number(form.unitWeight) || 0,
        issuedWeight: Number(form.issuedWeight) || 0,
        unit: form.unit || "",
      };
      const res = await api.post("/api/scaffolding-distribution", payload);
      if (res.success) {
        await fetchDistributions();
        await fetchStock();
        setForm({
          woNumber: "",
          location: "",
          tslManager: "",
          supervisorName: "",
          issueDate: new Date().toISOString().split("T")[0],
          itemName: "",
          unit: "",
          unitWeight: "",
          issuedQuantity: "",
          issuedWeight: "",
        });
        alert("✅ Distribution saved!");
      } else alert("❌ Failed to save distribution!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving distribution!");
    }
  };

  // ====================== UPDATE DISTRIBUTION ======================
  const updateDistribution = async () => {
    if (!editRecord) return;
    editRecord.issuedWeight = Number(
      (editRecord.unitWeight * editRecord.issuedQuantity).toFixed(2)
    );
    try {
      const res = await api.put(
        `/api/scaffolding-distribution/${editRecord._id}`,
        editRecord
      );
      if (res.success) {
        await fetchDistributions();
        await fetchStock();
        setEditRecord(null);
        alert("✅ Record updated!");
      } else alert("❌ Failed to update record!");
    } catch (err) {
      console.error(err);
      alert("❌ Error updating record!");
    }
  };

  // ====================== FILTER LOGIC ======================
  const filteredRecords = records.filter((r) => {
    const search = filters.search.toLowerCase();
    const date = new Date(r.issueDate);
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;

    return (
      (!from || date >= from) &&
      (!to || date <= to) &&
      (r.itemName.toLowerCase().includes(search) ||
        r.tslManager.toLowerCase().includes(search) ||
        r.supervisorName.toLowerCase().includes(search))
    );
  });

  // ====================== EXPORT ======================
  const exportPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    doc.text("Scaffolding Distribution Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [
        [
          "W/O No.",
          "Location",
          "TSL Manager",
          "Supervisor",
          "Date",
          "Item",
          "Unit",
          "Unit Wt.",
          "Issued Qty",
          "Issued Wt.",
        ],
      ],
      body: filteredRecords.map((r) => [
        r.woNumber,
        r.location,
        r.tslManager,
        r.supervisorName,
        r.issueDate.split("T")[0],
        r.itemName,
        r.unit,
        r.unitWeight,
        r.issuedQuantity,
        r.issuedWeight,
      ]),
    });
    doc.save("Distribution_Report.pdf");
  };

  const exportCSV = () => {
    const headers = [
      "W/O No.",
      "Location",
      "TSL Manager",
      "Supervisor",
      "Date",
      "Item",
      "Unit",
      "Unit Weight",
      "Issued Quantity",
      "Issued Weight",
    ];
    const rows = filteredRecords.map((r) => [
      r.woNumber,
      r.location,
      r.tslManager,
      r.supervisorName,
      r.issueDate.split("T")[0],
      r.itemName,
      r.unit,
      r.unitWeight,
      r.issuedQuantity,
      r.issuedWeight,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "Distribution_Report.csv";
    link.click();
  };

  // ====================== UI ======================
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Scaffolding Distribution</h2>

      {/* Tabs */}
      <div className={styles.tabButtons}>
        <button
          className={
            activeTab === "entry" ? styles.tabButtonActive : styles.tabButton
          }
          onClick={() => setActiveTab("entry")}
        >
          Entry Form
        </button>
        <button
          className={
            activeTab === "report" ? styles.tabButtonActive : styles.tabButton
          }
          onClick={() => setActiveTab("report")}
        >
          Report
        </button>
      </div>

      {/* ENTRY FORM */}
      {activeTab === "entry" && (
        <div className={styles.formSection}>
          <input
            type="text"
            placeholder="W/O Number *"
            value={form.woNumber}
            onChange={(e) => handleChange("woNumber", e.target.value)}
          />
          <input
            type="text"
            placeholder="Location *"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
          <input
            type="text"
            placeholder="TSL Manager *"
            value={form.tslManager}
            onChange={(e) => handleChange("tslManager", e.target.value)}
          />
          <input
            type="text"
            placeholder="Supervisor Name"
            value={form.supervisorName}
            onChange={(e) => handleChange("supervisorName", e.target.value)}
          />
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => handleChange("issueDate", e.target.value)}
          />
          <select
            value={form.itemName}
            onChange={(e) => handleChange("itemName", e.target.value)}
          >
            <option value="">Select Item *</option>
            {items.map((item, i) => (
              <option key={i} value={item.itemName}>
                {item.itemName} ({item.unit})
              </option>
            ))}
          </select>
          <input type="text" placeholder="Unit" value={form.unit} readOnly />
          <input
            type="number"
            placeholder="Unit Weight"
            value={form.unitWeight}
            onChange={(e) => handleChange("unitWeight", e.target.value)}
          />
          <input
            type="number"
            placeholder="Issued Quantity *"
            value={form.issuedQuantity}
            onChange={(e) => handleChange("issuedQuantity", e.target.value)}
          />
          <input
            type="number"
            placeholder="Issued Weight"
            value={form.issuedWeight}
            readOnly
          />
          <button onClick={handleAddDistribution} className={styles.saveButton}>
            💾 Save Distribution
          </button>
        </div>
      )}

      {/* REPORT */}
      {activeTab === "report" && (
        <>
          <div className={styles.filterSection}>
            <input
              type="text"
              placeholder="🔍 Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
            <button onClick={exportPDF} className={styles.pdfButton}>
              Export PDF
            </button>
            <button onClick={exportCSV} className={styles.csvButton}>
              Export CSV
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table>
                <thead>
                  <tr>
                    <th>W/O No.</th>
                    <th>Location</th>
                    <th>TSL Manager</th>
                    <th>Supervisor</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Unit Wt.</th>
                    <th>Issued Qty</th>
                    <th>Issued Wt.</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length ? (
                    filteredRecords.map((r) => (
                      <tr key={r._id}>
                        <td>{r.woNumber}</td>
                        <td>{r.location}</td>
                        <td>{r.tslManager}</td>
                        <td>{r.supervisorName}</td>
                        <td>{r.issueDate.split("T")[0]}</td>
                        <td>{r.itemName}</td>
                        <td>{r.unit}</td>
                        <td>{r.unitWeight}</td>
                        <td>{r.issuedQuantity}</td>
                        <td>{r.issuedWeight}</td>
                        <td>
                          <button
                            className={styles.editButton}
                            onClick={() =>
                              setEditRecord({
                                ...r,
                                issueDate: r.issueDate.split("T")[0],
                              })
                            }
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11}>No records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {editRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Distribution</h3>
            <input
              type="text"
              placeholder="W/O No."
              value={editRecord.woNumber}
              onChange={(e) =>
                setEditRecord({ ...editRecord, woNumber: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Location"
              value={editRecord.location}
              onChange={(e) =>
                setEditRecord({ ...editRecord, location: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="TSL Manager"
              value={editRecord.tslManager}
              onChange={(e) =>
                setEditRecord({ ...editRecord, tslManager: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Supervisor"
              value={editRecord.supervisorName}
              onChange={(e) =>
                setEditRecord({
                  ...editRecord,
                  supervisorName: e.target.value,
                })
              }
            />
            <input
              type="date"
              value={editRecord.issueDate}
              onChange={(e) =>
                setEditRecord({ ...editRecord, issueDate: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Item"
              value={editRecord.itemName}
              onChange={(e) =>
                setEditRecord({ ...editRecord, itemName: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Unit"
              value={editRecord.unit}
              onChange={(e) =>
                setEditRecord({ ...editRecord, unit: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Unit Weight"
              value={editRecord.unitWeight}
              onChange={(e) => {
                const uw = parseFloat(e.target.value);
                const newWeight = uw * editRecord.issuedQuantity;
                setEditRecord({
                  ...editRecord,
                  unitWeight: uw,
                  issuedWeight: newWeight,
                });
              }}
            />
            <input
              type="number"
              placeholder="Issued Quantity"
              value={editRecord.issuedQuantity}
              onChange={(e) => {
                const qty = parseFloat(e.target.value);
                const newWeight = qty * editRecord.unitWeight;
                setEditRecord({
                  ...editRecord,
                  issuedQuantity: qty,
                  issuedWeight: newWeight,
                });
              }}
            />
            <input
              type="number"
              placeholder="Issued Weight"
              value={editRecord.issuedWeight}
              readOnly
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={updateDistribution} className={styles.saveButton}>
                💾 Save
              </button>
              <button
                onClick={() => setEditRecord(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => router.back()} className={styles.backButton}>
        Back
      </button>
    </div>
  );
}
