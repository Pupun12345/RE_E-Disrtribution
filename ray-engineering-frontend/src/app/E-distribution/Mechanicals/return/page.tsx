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
  const exportCSV = () => {
    // Prepare CSV headers
    const headers = [
      "Item Name",
      "Qty",
      "Unit",
      "Return Date",
      "Person Name",
      "Location / Site",
    ];

    // Flatten the filtered records into CSV rows
    const rows = filteredRecords.flatMap((record) =>
      record.items.map((item) => [
        item.itemName,
        item.qty,
        item.unit,
        item.returnDate,
        item.personName,
        item.location,
      ])
    );

    // Build CSV content
    let csvContent = "";
    csvContent += headers.join(",") + "\n";

    rows.forEach((row) => {
      // Escape commas and quotes in data
      const escapedRow = row.map((field) => {
        if (
          typeof field === "string" &&
          (field.includes(",") || field.includes('"'))
        ) {
          return `"${field.replace(/"/g, '""')}"`; // double quotes inside quotes
        }
        return field;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link and trigger download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "mechanical_return_report.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ------------------------------------------
    // HEADER (Every Page)
    // ------------------------------------------
    const addHeader = () => {
      doc.addImage("/ray-log.png", "PNG", 15, 10, 18, 18);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RAY ENGINEERING", 50, 15);

      doc.setFontSize(10);
      doc.text("Contact No: 9337670266", 50, 22);
      doc.text("E-Mail: accounts@rayengineering.co", 50, 28);

      doc.setLineWidth(0.5);
      doc.line(10, 40, 200, 40);

      doc.setFontSize(16);
      doc.text("MECHANICAL RETURN REPORT", pageWidth / 2, 55, {
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

    // Draw first-page header
    addHeader();

    // ------------------------------------------
    // TABLE (Multi-page with header repeat)
    // ------------------------------------------
    autoTable(doc, {
      startY: 65,
      margin: { top: 60, bottom: 50 },

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

      styles: { fontSize: 10, halign: "center", cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: "#fff" },
      theme: "grid",

      didDrawPage: () => {
        addHeader(); // repeat header only
      },
    });

    // ------------------------------------------
    // FOOTERS AFTER PAGES ARE BUILT
    // ------------------------------------------
    const totalPages = doc.getNumberOfPages();

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addFooter(p, totalPages);
    }

    // Save PDF
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
                {editingId ? "Update Return" : "Save Return"}
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
                Download Report
              </button>
              <button
                onClick={exportCSV}
                style={{
                  backgroundColor: "#FACC15", // ✅ Yellow like your screenshot
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Export CSV
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
//updated delete button
