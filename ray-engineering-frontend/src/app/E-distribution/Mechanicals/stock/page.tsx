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
      doc.text("MECHANICAL STOCK REPORT", pageWidth / 2, 55, {
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

    // First header
    addHeader();

    // ------------------------------------------
    // TABLE (Multi-page with header repeat)
    // ------------------------------------------
    autoTable(doc, {
      startY: 65,
      margin: { top: 60, bottom: 50 },

      head: [["Item", "Quantity", "Unit", "Status"]],

      body: filteredStocks.map((s) => [
        s.itemName,
        s.qty,
        s.unit || "-",
        s.qty > 10 ? "In Stock" : s.qty > 0 ? "Low Stock" : "Out of Stock",
      ]),

      styles: { fontSize: 10, halign: "center", cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: "#fff" },
      theme: "grid",

      didDrawPage: () => {
        addHeader();
      },
    });

    // ------------------------------------------
    // FOOTER FOR ALL PAGES
    // ------------------------------------------
    const totalPages = doc.getNumberOfPages();

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addFooter(p, totalPages);
    }

    // Save file
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
