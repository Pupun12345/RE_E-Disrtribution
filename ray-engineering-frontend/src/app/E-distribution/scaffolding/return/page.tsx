"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/utils/api";
import styles from "./return.module.css";

interface ReturnItem {
  woNumber: string;
  location: string;
  tslManager: string;
  supervisorName: string;
  returnDate: string;
  itemName: string;
  unitWeight: number | string;
  issuedQty: number | string;
  issuedWeight: number | string;
  unit: string;
}

interface SavedItem {
  itemName: string;
  unit: string;
}

interface ReturnRecord {
  _id?: string;
  woNumber: string;
  location: string;
  personName: string;
  returnDate: string;
  itemName: string;
  unit: string;
  unitWeight: number;
  returnQuantity: number;
  returnWeight: number;
}

export default function ReturnPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("entry");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formData, setFormData] = useState<ReturnItem>({
    woNumber: "",
    location: "",
    tslManager: "",
    supervisorName: "",
    returnDate: "",
    itemName: "",
    unitWeight: "",
    issuedQty: "",
    issuedWeight: "",
    unit: "",
  });
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

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
      const res = await api.get("/api/scaffolding-items");
      const itemsArray = res.items || [];
      setSavedItems(itemsArray);
    } catch (err) {
      console.error("Error fetching items:", err);
      showMessage("⚠️ Failed to fetch items");
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await api.get("/api/scaffolding-returns");
      const list = res.returns || [];
      setReturnRecords(list);
    } catch (err) {
      console.error("Error fetching returns:", err);
      showMessage("⚠️ Failed to fetch return records");
    }
  };

  // ✅ Updated handleChange with auto-calculation
  const handleChange = (field: keyof ReturnItem, value: string | number) => {
    let updated = { ...formData, [field]: value };

    // Auto-update unit when selecting an item
    if (field === "itemName") {
      const selected = savedItems.find((s) => s.itemName === value);
      updated.unit = selected ? selected.unit : "";
    }

    // Auto-calculate Return Weight = Unit Weight × Return Quantity
    const qty = Number(field === "issuedQty" ? value : formData.issuedQty) || 0;
    const unitWt =
      Number(field === "unitWeight" ? value : formData.unitWeight) || 0;
    updated.issuedWeight = qty * unitWt;

    setFormData(updated);
  };

  const handleSave = async () => {
    if (
      !formData.itemName ||
      !formData.woNumber ||
      !formData.tslManager ||
      !formData.issuedQty
    ) {
      showMessage("⚠️ Fill all required fields before saving");
      return;
    }

    const payload = {
      woNumber: formData.woNumber.trim(),
      location: formData.location.trim(),
      personName: formData.tslManager.trim(),
      returnDate: formData.returnDate
        ? new Date(formData.returnDate)
        : new Date(),
      itemName: formData.itemName.trim(),
      unit: formData.unit,
      unitWeight: Number(formData.unitWeight) || 0,
      returnQuantity: Number(formData.issuedQty),
      returnWeight: Number(formData.issuedWeight) || 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/scaffolding-returns/${editingId}`, payload);
        showMessage("✅ Return updated successfully");
      } else {
        await api.post("/api/scaffolding-returns", payload);
        showMessage("✅ Return saved successfully");
      }

      setFormData({
        woNumber: "",
        location: "",
        tslManager: "",
        supervisorName: "",
        returnDate: "",
        itemName: "",
        unitWeight: "",
        issuedQty: "",
        issuedWeight: "",
        unit: "",
      });
      setEditingId(null);
      fetchReturns();
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save return — backend error");
    }
  };

  const handleEdit = (record: ReturnRecord) => {
    setActiveTab("entry");
    setFormData({
      woNumber: record.woNumber,
      location: record.location,
      tslManager: record.personName,
      supervisorName: "",
      returnDate: record.returnDate
        ? new Date(record.returnDate).toISOString().split("T")[0]
        : "",
      itemName: record.itemName,
      unitWeight: record.unitWeight,
      issuedQty: record.returnQuantity,
      issuedWeight: record.returnWeight,
      unit: record.unit,
    });
    setEditingId(record._id || null);
    showMessage("✏️ Editing existing record");
  };
  // ================= FILTER LOGIC =================
  const filteredRecords = returnRecords.filter((r) => {
    const matchesSearch =
      r.itemName.toLowerCase().includes(search.toLowerCase()) ||
      r.personName.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());

    const recordDate = r.returnDate
      ? new Date(r.returnDate).toISOString().split("T")[0]
      : "";

    const matchesFromDate = fromDate ? recordDate >= fromDate : true;
    const matchesToDate = toDate ? recordDate <= toDate : true;

    return matchesSearch && matchesFromDate && matchesToDate;
  });

  const handleDelete = async (record: ReturnRecord) => {
    const formattedDate = record.returnDate
      ? new Date(record.returnDate).toISOString().split("T")[0]
      : "";

    if (
      !window.confirm(`Delete ${record.itemName} returned on ${formattedDate}?`)
    ) {
      return;
    }

    try {
      const res = await api.delete(`/api/scaffolding-returns/${record._id}`);

      if (res.success) {
        showMessage("🗑️ Return deleted successfully");
        fetchReturns();
      } else {
        showMessage("❌ Failed to delete return");
      }
    } catch (err) {
      console.error(err);
      showMessage("❌ Error deleting return");
    }
  };
  const exportCSV = () => {
    const headers = [
      "W/O No,Location,TSL Manager,Return Date,Item,Unit,Unit Wt,Return Qty,Return Wt",
    ];

    const rows = returnRecords.map((r) => [
      r.woNumber,
      r.location,
      r.personName,
      r.returnDate ? new Date(r.returnDate).toLocaleDateString() : "",
      r.itemName,
      r.unit,
      r.unitWeight,
      r.returnQuantity,
      r.returnWeight,
    ]);

    let csvContent = headers.join("\n") + "\n";

    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Return_Report.csv");
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4"); // Portrait orientation

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header function (similar to generateInvoicePDF)
    const addHeader = () => {
      doc.addImage("/ray-log.png", "PNG", 15, 10, 18, 18);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RAY ENGINEERING", 50, 15);

      doc.setFontSize(10);
      doc.text("Contact No: 9337670266", 50, 22);
      doc.text("E-Mail: accounts@rayengineering.co", 50, 28);

      doc.setLineWidth(0.5);
      doc.line(10, 40, pageWidth - 10, 40);

      doc.setFontSize(16);
      doc.text("RETURN REPORT", pageWidth / 2, 55, { align: "center" });
    };

    // Footer function (similar to generateInvoicePDF)
    const addFooter = (pageNum: number, totalPages: number) => {
      const footerY = pageHeight - 40;

      doc.line(10, footerY, pageWidth - 10, footerY);
      doc.setFontSize(9);

      doc.text(
        "Registrations:\nGSTIN: 21AIJHPR1040H1ZO\nUDYAM: DO-12-0001261\nState: Odisha (Code: 21)",
        10,
        footerY + 8
      );

      doc.text(
        "Registered Address:\nAt- Gandakipur, Po- Gopiakuda,\nPs- Kujanga, Dist- Jagatsinghpur",
        pageWidth / 3,
        footerY + 8
      );

      doc.text(
        `Contact & Web:\nMD Email: md@rayengineering.co\nWebsite: rayengineering.co\nPage ${pageNum} / ${totalPages}`,
        (pageWidth / 3) * 2,
        footerY + 8
      );
    };

    // Draw first page header
    addHeader();

    // Generate the table using autoTable
    autoTable(doc, {
      startY: 65,
      margin: { top: 60, bottom: 50 },

      head: [
        [
          "W/O No",
          "Location",
          "TSL Manager",
          "Return Date",
          "Item",
          "Unit",
          "Unit Wt",
          "Return Qty",
          "Return Wt",
        ],
      ],

      body: returnRecords.map((r) => [
        r.woNumber,
        r.location,
        r.personName,
        r.returnDate ? new Date(r.returnDate).toLocaleDateString() : "",
        r.itemName,
        r.unit,
        r.unitWeight,
        r.returnQuantity,
        r.returnWeight,
      ]),

      styles: { fontSize: 10, halign: "center", cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: "#fff" },
      theme: "grid",

      didDrawPage: () => {
        addHeader();
      },
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    // Save PDF
    doc.save("Return_Report.pdf");
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>RETURN MATERIALS</h1>
        {message && <div className={styles.toast}>{message}</div>}

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

        {activeTab === "entry" && (
          <div className={styles.formCard}>
            <div className={styles.grid}>
              <input
                placeholder="W/O Number *"
                value={formData.woNumber}
                onChange={(e) => handleChange("woNumber", e.target.value)}
              />
              <input
                placeholder="Location / Site *"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              <input
                placeholder="TSL Manager *"
                value={formData.tslManager}
                onChange={(e) => handleChange("tslManager", e.target.value)}
              />
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleChange("returnDate", e.target.value)}
              />
              <select
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
              >
                <option value="">Select Item *</option>
                {savedItems.map((si, idx) => (
                  <option key={idx} value={si.itemName}>
                    {si.itemName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Unit Weight"
                value={formData.unitWeight}
                onChange={(e) => handleChange("unitWeight", e.target.value)}
              />
              <input
                type="number"
                placeholder="Return Quantity *"
                value={formData.issuedQty}
                onChange={(e) => handleChange("issuedQty", e.target.value)}
              />
              <input
                type="number"
                placeholder="Return Weight (Auto)"
                value={formData.issuedWeight}
                readOnly
              />
            </div>

            <button className={styles.saveButton} onClick={handleSave}>
              💾 {editingId ? "Update Return" : "Save Return"}
            </button>
          </div>
        )}

        {activeTab === "report" && (
          <>
            <div className={styles.filterBar}>
              <input
                type="text"
                placeholder="🔍Item / Person / Location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.filterInput}
              />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.filterInput}
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.filterInput}
              />

              <button className={styles.pdfButton} onClick={exportPDF}>
                Download Report
              </button>

              <button className={styles.csvButton} onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>W/O No</th>
                    <th>Location</th>
                    <th>TSL Manager</th>
                    <th>Return Date</th>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Unit Wt</th>
                    <th>Return Qty</th>
                    <th>Return Wt</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center" }}>
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r._id}>
                        <td>{r.woNumber}</td>
                        <td>{r.location}</td>
                        <td>{r.personName}</td>
                        <td>
                          {r.returnDate
                            ? new Date(r.returnDate).toLocaleDateString()
                            : ""}
                        </td>
                        <td>{r.itemName}</td>
                        <td>{r.unit}</td>
                        <td>{r.unitWeight}</td>
                        <td>{r.returnQuantity}</td>
                        <td>{r.returnWeight}</td>
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
                            onClick={() => handleDelete(r)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.bottomButtons}>
              <button
                className={styles.backButton}
                onClick={() => router.back()}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
//updated delete button
