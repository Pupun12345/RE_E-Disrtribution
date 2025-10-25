"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./stockreport.module.css";
import { api } from "@/utils/api"; // your existing api helper

interface Stock {
  itemName: string;
  qty: number;
  unit?: string;
}

export default function StockReportPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");

  // ✅ Load stocks from API or localStorage
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await api.get("/api/stock");
        if (res && Array.isArray(res)) {
          setStocks(
            res.map((s: Stock) => ({
              ...s,
              qty: Math.max(0, Math.round(s.qty)),
            }))
          );
          localStorage.setItem("stocks", JSON.stringify(res));
          return;
        }
      } catch (err) {
        console.warn("⚠️ Could not fetch live stock, using localStorage:", err);
      }

      // fallback to localStorage
      const saved = localStorage.getItem("stocks");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Stock[];
          setStocks(
            parsed.map((s) => ({
              ...s,
              qty: Math.max(0, Math.round(s.qty)),
            }))
          );
        } catch {
          setStocks([]);
        }
      }
    };

    fetchStock();

    // auto-refresh on localStorage change (multi-tab sync)
    const handleStorage = () => {
      const saved = localStorage.getItem("stocks");
      if (saved) {
        try {
          setStocks(JSON.parse(saved));
        } catch {
          setStocks([]);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ✅ Search filter
  const filteredStocks = stocks.filter((s) =>
    s.itemName.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ PDF generator
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Report", 14, 15);
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
    doc.save("stock_report.pdf");
  };

  const handleBack = () => router.back();

  // ✅ UI Rendering
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Stock Overview</h2>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search Item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={generatePDF} className={styles.pdfBtn}>
          📄 Export PDF
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
            {filteredStocks.length > 0 ? (
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
                <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                  No stock data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button className={styles.backButton} onClick={handleBack}>
        ⬅ Go Back
      </button>
    </div>
  );
}
