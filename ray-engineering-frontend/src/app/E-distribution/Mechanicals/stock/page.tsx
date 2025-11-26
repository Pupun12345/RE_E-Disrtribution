"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./stockreport.module.css";
import { api } from "@/utils/api"; // your API helper

interface Stock {
  itemName: string;
  qty: number;
  unit?: string;
}

export default function StockReportPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch stock from backend
  const fetchStock = async () => {
    try {
      const res = await api.get("/api/mechanical/stock"); // updated route
      if (res?.success && Array.isArray(res.stock)) {
        setStocks(
          res.stock.map((s: Stock) => ({
            ...s,
            qty: Math.max(0, Number(s.qty)), // ensure qty is a number ≥ 0
          }))
        );
      } else {
        setStocks([]);
      }
    } catch (err) {
      console.error("Error fetching stock:", err);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // ✅ Filter stocks by search
  const filteredStocks = stocks.filter((s) =>
    s.itemName.toLowerCase().includes(search.toLowerCase())
  );
  const exportCSV = () => {
    const headers = ["Item Name", "Quantity", "Unit", "Status"];
    const rows = filteredStocks.map((s) => [
      s.itemName,
      s.qty.toString(),
      s.unit || "-",
      s.qty > 10 ? "In Stock" : s.qty > 0 ? "Low Stock" : "Out of Stock",
    ]);
    const csvContent = [headers, ...rows]
      .map((e) => e.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "stock_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ✅ PDF export
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Mechanical Stock Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Item", "Quantity", "Unit", "Status"]],
      body: filteredStocks.map((s) => [
        s.itemName,
        s.qty,
        s.unit || "-",
        s.qty > 10 ? "In Stock" : s.qty > 0 ? "Low Stock" : "Out of Stock",
      ]),
    });
    doc.save("mechanical_stock_report.pdf");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Mechanical Stock Overview</h2>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search Item..."
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
              <th>Quantity</th>
              <th>Unit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  Loading stock...
                </td>
              </tr>
            ) : filteredStocks.length > 0 ? (
              filteredStocks.map((s, index) => (
                <tr key={index}>
                  <td>{s.itemName}</td>
                  <td>{s.qty}</td>
                  <td>{s.unit || "-"}</td>
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
                    {s.qty > 10
                      ? "In Stock"
                      : s.qty > 0
                      ? "Low Stock"
                      : "Out of Stock"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  No stock data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button className={styles.backButton} onClick={() => router.back()}>
        Go Back
      </button>
    </div>
  );
}
