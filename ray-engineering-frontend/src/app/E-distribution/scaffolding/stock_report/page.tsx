"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./stockreport.module.css";
import { api } from "@/utils/api";

// ====================== INTERFACES ======================
interface Stock {
  itemName: string;
  puw: number; // Per Unit Weight
  unit: string; // Unit type (pcs, pair, mtr, etc.)
  qty: number; // Quantity
}

// ====================== COMPONENT ======================
export default function StockReportPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch stocks from backend
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await api.get("/api/scaffolding-stock");
        if (res && Array.isArray(res)) {
          setStocks(
            res.map((s: any) => ({
              itemName: s.itemName || "",
              puw: s.puw || 0,
              unit: s.unit || "",
              qty: Math.max(0, Math.round(s.qty || 0)),
            }))
          );
        } else {
          setStocks([]);
        }
      } catch (err) {
        console.error("⚠️ Failed to fetch stock:", err);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  // ✅ Filter by search
  const filteredStocks = stocks.filter((s) =>
    s.itemName.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Determine status
  const getStatus = (qty: number) => {
    if (qty > 10) return "In Stock";
    if (qty > 0) return "Low Stock";
    return "Out of Stock";
  };
  const exportCSV = () => {
    // CSV headers
    const headers = [
      "Item Name",
      "PUW (Per Unit Weight)",
      "Unit",
      "Quantity",
      "Status",
    ];

    // Escape helper
    const safe = (value: any) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Prepare rows
    const rows = filteredStocks.map((s) => [
      s.itemName || "",
      s.puw?.toFixed(2) || "0.00", // ✅ Added PUW safely
      s.unit || "-",
      s.qty?.toString() || "0",
      s.qty > 10 ? "In Stock" : s.qty > 0 ? "Low Stock" : "Out of Stock",
    ]);

    // Build CSV text
    const csvContent = [headers, ...rows]
      .map((line) => line.map(safe).join(","))
      .join("\n");

    // Trigger download
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "stock_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ✅ PDF Export
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Item Name", "PUW", "Unit", "Quantity", "Status"]],
      body: filteredStocks.map((s) => [
        s.itemName,
        s.puw.toFixed(2),
        s.unit,
        s.qty,
        getStatus(s.qty),
      ]),
    });
    doc.save("Stock_Report.pdf");
  };

  // ✅ Go Back
  const handleBack = () => router.back();

  // ✅ Render UI
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📦 Stock Report</h2>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search by Item Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={generatePDF} className={styles.pdfBtn}>
          Export PDF
        </button>
        <button
          onClick={exportCSV}
          className={styles.csvBtn}
          style={{ marginLeft: "0.5rem" }}
        >
          Export CSV
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>PUW (Per Unit Weight)</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  Loading stock...
                </td>
              </tr>
            ) : filteredStocks.length > 0 ? (
              filteredStocks.map((s, index) => (
                <tr key={index}>
                  <td>{s.itemName}</td>
                  <td>{s.puw.toFixed(2)}</td>
                  <td>{s.unit}</td>
                  <td>{s.qty}</td>
                  <td
                    style={{
                      color:
                        s.qty > 10
                          ? "#22c55e"
                          : s.qty > 0
                          ? "#f59e0b"
                          : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {getStatus(s.qty)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  No stock records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button className={styles.backButton} onClick={handleBack}>
        Go Back
      </button>
    </div>
  );
}
