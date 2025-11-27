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
}

interface DistributionRecord {
  _id: string;
  itemName: string;
  quantity: number;
  unit: string;
  issueDate: string;
  personName: string;
  location: string;
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
  const router = useRouter();

  const [form, setForm] = useState({
    itemName: "",
    quantity: "",
    unit: "",
    issueDate: new Date().toISOString().split("T")[0],
    personName: "",
    location: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    from: "",
    to: "",
  });

  const [editRecord, setEditRecord] = useState<DistributionRecord | null>(null);

  // ====================== FETCH DATA ======================
  useEffect(() => {
    fetchItems();
    fetchStock();
    fetchDistributions();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/mechanical/items");
      if (Array.isArray(res)) setItems(res);
      else if (res.items) setItems(res.items);
    } catch (err) {
      console.error("Error loading items:", err);
      alert("⚠️ Failed to load items!");
    }
  };

  const fetchStock = async () => {
    try {
      const res = await api.get("/api/mechanical/stock");
      const stockData = Array.isArray(res.stock) ? res.stock : res;
      setStock(stockData);
    } catch (err) {
      console.error("Error loading stock:", err);
      alert("⚠️ Failed to load stock!");
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await api.get("/api/mechanical/distribution");
      if (Array.isArray(res)) setRecords(res);
      else if (res.distributions) setRecords(res.distributions);
    } catch (err) {
      console.error("Error loading distributions:", err);
      alert("⚠️ Failed to load distributions!");
    }
  };

  // ====================== HANDLERS ======================
  const handleChange = (field: string, value: string) => {
    if (field === "itemName") {
      const selected = items.find((i) => i.itemName === value);
      setForm({
        ...form,
        itemName: value,
        unit: selected ? selected.unit : "",
      });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const validate = () => {
    const { itemName, quantity, personName } = form;
    if (!itemName || !quantity || !personName) {
      alert("⚠️ Please fill all required fields.");
      return false;
    }

    const qtyNum = Number(quantity);
    if (qtyNum <= 0) {
      alert("⚠️ Quantity must be greater than zero.");
      return false;
    }

    const stockItem = stock.find((s) => s.itemName === itemName);
    const available = stockItem ? stockItem.qty : 0;
    if (available < qtyNum) {
      alert(`⚠️ Not enough stock. Available: ${available}`);
      return false;
    }

    return true;
  };

  const handleAddDistribution = async () => {
    if (!validate()) return;

    try {
      const res = await api.post("/api/mechanical/distribution", {
        itemName: form.itemName,
        quantity: Number(form.quantity),
        unit: form.unit,
        issueDate: form.issueDate,
        personName: form.personName.trim(),
        location: form.location.trim(),
      });

      if (res.success) {
        setRecords((prev) => [...prev, res.record]);
        setStock((prev) =>
          prev.map((s) =>
            s.itemName === form.itemName
              ? { ...s, qty: s.qty - Number(form.quantity) }
              : s
          )
        );
        setForm({
          itemName: "",
          quantity: "",
          unit: "",
          issueDate: new Date().toISOString().split("T")[0],
          personName: "",
          location: "",
        });
        alert("✅ Distribution saved successfully!");
      } else {
        alert("❌ Failed to save distribution!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error saving distribution!");
    }
  };

  const updateDistribution = async () => {
    if (!editRecord) return;
    try {
      const res = await api.put(
        `/api/mechanical/distribution/${editRecord._id}`,
        editRecord
      );
      if (res.success) {
        setRecords((prev) =>
          prev.map((r) => (r._id === editRecord._id ? res.record : r))
        );
        setEditRecord(null);
        alert("✅ Record updated successfully!");
      } else {
        alert("❌ Failed to update record!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error updating record!");
    }
  };
  const handleDelete = async (id: string | undefined) => {
    if (!id) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete this distribution?"
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/api/mechanical/distribution/${id}`);

      const updatedList = Array.isArray(res.distributions)
        ? res.distributions
        : [];

      setRecords(updatedList);

      // Refresh stock
      fetchStock();

      alert(" Distribution deleted & stock updated!");
    } catch (err) {
      console.error("Delete Error:", err);
      alert("❌ Failed to delete distribution");
    }
  };

  // ====================== FILTER LOGIC ======================
  const filteredRecords = records.filter((r) => {
    const searchMatch =
      r.itemName.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.personName.toLowerCase().includes(filters.search.toLowerCase());
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;
    const date = new Date(r.issueDate);
    const dateMatch = (!from || date >= from) && (!to || date <= to);
    return searchMatch && dateMatch;
  });

  // ====================== EXPORT ======================
  const exportPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ------------------------------------------
  // HEADER (Every Page)
  // ------------------------------------------
  const addHeader = () => {
    // Logo
    doc.addImage("/ray-log.png", "PNG", 15, 10, 18, 18);

    // Title (Company)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RAY ENGINEERING", 50, 15);

    // Sub-title
    doc.setFontSize(10);
    doc.text("Contact No: 9337670266", 50, 22);
    doc.text("E-Mail: accounts@rayengineering.co", 50, 28);

    // Divider
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);

    // Report Title
    doc.setFontSize(16);
    doc.text("MECHANICAL DISTRIBUTION REPORT", pageWidth / 2, 55, {
      align: "center",
    });
  };

  // ------------------------------------------
  // FOOTER (Every Page)
  // ------------------------------------------
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 40;

    doc.line(10, footerY, 200, footerY);
    doc.setFontSize(9);

    doc.text(
      "Registrations:\nGSTIN: 21AIJHPR1040H1ZO\nUDYAM: DO-12-0001261\nState: Odisha (Code: 21)",
      10,
      footerY + 8
    );

    doc.text(
      "Registered Address:\nAt- Gandakipur, Po- Gopiakuda,\nPs- Kujanga, Dist- Jagatsinghpur",
      75,
      footerY + 8
    );

    doc.text(
      `Contact & Web:\nMD Email: md@rayengineering.co\nWebsite: rayengineering.co\nPage ${pageNum} / ${totalPages}`,
      150,
      footerY + 8
    );
  };

  // First page header
  addHeader();

  // ------------------------------------------
  // TABLE (Multi-page with header repeat)
  // ------------------------------------------
  autoTable(doc, {
    startY: 65,
    margin: { top: 60, bottom: 50 },

    head: [["Item", "Qty", "Unit", "Date", "Person", "Location"]],

    body: filteredRecords.map((r) => [
      r.itemName,
      r.quantity,
      r.unit,
      r.issueDate,
      r.personName,
      r.location,
    ]),

    styles: { fontSize: 10, halign: "center", cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: "#fff" },
    theme: "grid",

    didDrawPage: () => {
      addHeader(); // Only header here
    },
  });

  // ------------------------------------------
  // ADD FOOTERS AFTER PAGES ARE COMPLETE
  // ------------------------------------------
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(p, totalPages);
  }

  // Save PDF
  doc.save("Mechanical_Distribution_Report.pdf");
};


  const exportCSV = () => {
    const headers = ["Item", "Quantity", "Unit", "Date", "Person", "Location"];
    const rows = filteredRecords.map((r) => [
      r.itemName,
      r.quantity,
      r.unit,
      r.issueDate,
      r.personName,
      r.location,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Mechanical_Distribution_Report.csv";
    link.click();
  };

  // ====================== UI ======================
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Mechanical Distribution</h2>

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
        <>
          <div className={styles.formSection}>
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

            <input
              type="number"
              placeholder="Quantity *"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
            />
            <input type="text" placeholder="Unit" value={form.unit} readOnly />
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => handleChange("issueDate", e.target.value)}
            />
            <input
              type="text"
              placeholder="Issued To (Person Name) *"
              value={form.personName}
              onChange={(e) => handleChange("personName", e.target.value)}
            />
            <input
              type="text"
              placeholder="Location / Site"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button
              onClick={handleAddDistribution}
              className={styles.addButton}
            >
              Save Distribution
            </button>
          </div>
        </>
      )}

      {/* REPORT SECTION */}
      {activeTab === "report" && (
        <>
          <div className={styles.filterSection}>
            <input
              type="text"
              placeholder="🔍 Search Item / Person"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
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
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Date</th>
                  <th>Issued To</th>
                  <th>Location</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map((r) => (
                    <tr key={r._id}>
                      <td>{r.itemName}</td>
                      <td>{r.quantity}</td>
                      <td>{r.unit}</td>
                      <td>{r.issueDate}</td>
                      <td>{r.personName}</td>
                      <td>{r.location}</td>
                      <td>
                        <button
                          onClick={() => setEditRecord(r)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {editRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Distribution</h3>

            <label>Item</label>
            <input type="text" value={editRecord.itemName} readOnly />

            <label>Qty</label>
            <input
              type="number"
              value={editRecord.quantity}
              onChange={(e) =>
                setEditRecord({
                  ...editRecord,
                  quantity: Number(e.target.value),
                })
              }
            />

            <label>Unit</label>
            <input type="text" value={editRecord.unit} readOnly />

            <label>Date</label>
            <input
              type="date"
              value={editRecord.issueDate.split("T")[0]}
              onChange={(e) =>
                setEditRecord({ ...editRecord, issueDate: e.target.value })
              }
            />

            <label>Issued To</label>
            <input
              type="text"
              value={editRecord.personName}
              onChange={(e) =>
                setEditRecord({ ...editRecord, personName: e.target.value })
              }
            />

            <label>Location</label>
            <input
              type="text"
              value={editRecord.location}
              onChange={(e) =>
                setEditRecord({ ...editRecord, location: e.target.value })
              }
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={updateDistribution}
                className={styles.saveButton}
              >
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
//updated delete button