"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/utils/api";
import styles from "./purchase.module.css";

/* ============================
   📘 INTERFACES (Data Models)
=============================== */
interface Item {
  itemName: string;
  unit: string;
  uom: string; // ✅ Added: Unit of Measurement
  qty: number | string;
  rate: number | string;
  amount: number;
  workOrderNumber: string; // ✅ Added: Work Order Number
}

interface SavedItem {
  itemName: string;
  unit: string;
}

interface Purchase {
  _id?: string;
  id?: number;
  partyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: Item[];
  total: number;
}

/* ============================
   📘 MAIN COMPONENT
=============================== */
export default function PurchasePage() {
  const router = useRouter();

  /* ---------------------- State Management ---------------------- */
  const [activeTab, setActiveTab] = useState("entry");
  const [partyName, setPartyName] = useState("");
  const [partyNames, setPartyNames] = useState<{ id: string; name: string }[]>(
    []
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [filter, setFilter] = useState({ party: "", from: "", to: "" });

  /* ---------------------- Toast Notification ---------------------- */
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  /* ---------------------- Data Fetching ---------------------- */
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([fetchVendors(), fetchSavedItems(), fetchPurchases()]);
  };

  // 🧾 Load all vendors
  const fetchVendors = async () => {
    try {
      const res = await api.get("/api/vendors");
      const vendorsArray = Array.isArray(res) ? res : res.vendors || [];
      const formatted = vendorsArray.map((v: any) => ({
        id: v._id || v.id,
        name: v.partyName || v.name || "Unnamed Vendor",
      }));
      setPartyNames(formatted);
    } catch (err: any) {
      console.error("Error fetching vendors:", err);
      showMessage("⚠️ Failed to fetch vendor list");
    }
  };

  // 📦 Load saved items
  const fetchSavedItems = async () => {
    try {
      const res = await api.get("/api/scaffolding-items");
      const itemsArray = Array.isArray(res) ? res : res.items || [];
      setSavedItems(itemsArray);
    } catch (err) {
      console.error("Error fetching items:", err);
      showMessage("⚠️ Failed to fetch items");
    }
  };

  // 🧾 Load purchase records
  const fetchPurchases = async () => {
    try {
      const res = await api.get("/api/scaffolding-purchases");
      const list = Array.isArray(res) ? res : res.purchases || [];
      setPurchases(list);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      showMessage("⚠️ Failed to fetch purchase records");
    }
  };

  useEffect(() => {
    if (activeTab === "report") fetchPurchases();
  }, [activeTab]);

  /* ---------------------- Item Handling ---------------------- */
  const handleItemChange = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const updated = [...items];

    if (field === "itemName") {
      const selected = savedItems.find((s) => s.itemName === value);
      updated[index].itemName = value as string;
      updated[index].unit = selected ? selected.unit : "";
    } else if (field === "qty" || field === "rate") {
      updated[index][field] = value;
      const qty = Number(updated[index].qty) || 0;
      const rate = Number(updated[index].rate) || 0;
      updated[index].amount = qty * rate;
    } else {
      updated[index][field] = value as never;
    }

    setItems(updated);
  };

  const addItem = () =>
    setItems([
      ...items,
      {
        itemName: "",
        unit: "",
        uom: "",
        qty: "",
        rate: "",
        amount: 0,
        workOrderNumber: "",
      },
    ]);

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  /* ---------------------- Totals ---------------------- */
  const totalInvoice = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const [gstPercent, setGstPercent] = useState(0);
  const gstAmount = (totalInvoice * gstPercent) / 100;
  const grandTotal = totalInvoice + gstAmount;

  /* ---------------------- Save / Update ---------------------- */
  const handleSave = async () => {
    if (!partyName || !invoiceNumber || !invoiceDate || items.length === 0) {
      showMessage("⚠️ Please fill all fields & add at least one item");
      return;
    }

    const payload = {
      partyName,
      invoiceNumber,
      invoiceDate,
      items,
      total: grandTotal,
    };

    try {
      if (editingId) {
        await api.put(`/api/purchases/${editingId}`, payload);
        showMessage("✅ Purchase updated successfully");
      } else {
        await api.post("/api/scaffolding-purchases", payload);
        showMessage("✅ Purchase saved successfully");
      }

      // Reset form
      setPartyName("");
      setInvoiceNumber("");
      setInvoiceDate("");
      setItems([]);
      setEditingId(null);
      fetchPurchases();
    } catch (err) {
      console.error("Save error:", err);
      showMessage("❌ Failed to save — backend error");
    }
  };

  /* ---------------------- Edit Existing Record ---------------------- */
  const handleEdit = (p: Purchase) => {
    setActiveTab("entry");
    setPartyName(p.partyName);
    setInvoiceNumber(p.invoiceNumber);
    setInvoiceDate(p.invoiceDate);
    setItems(p.items);
    setEditingId(p._id || null);
    showMessage("✏️ Editing existing record");
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;

    if (!confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const res = await api.delete(`/api/scaffolding-purchases/${id}`);
      showMessage("🗑️ Purchase deleted");

      fetchPurchases(); // refresh list
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to delete purchase");
    }
  };
  const exportCSV = () => {
    const headers = [
      "Party Name",
      "Invoice Number",
      "Invoice Date",
      "Items",
      "Total (₹)",
    ];
    const rows = filteredPurchases.map((p) => [
      p.partyName,
      p.invoiceNumber,
      p.invoiceDate,
      p.items.map((i) => i.itemName).join(", "),
      p.total.toFixed(2),
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    // Create Blob with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Purchase_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ---------------------- PDF Export ---------------------- */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Report", 14, 16);
    autoTable(doc, {
      startY: 25,
      head: [["Party", "Invoice No", "Date", "Items", "Total (₹)"]],
      body: purchases.map((p) => [
        p.partyName,
        p.invoiceNumber,
        p.invoiceDate,
        p.items.map((i) => i.itemName).join(", "),
        p.total.toFixed(2),
      ]),
    });
    doc.save("Purchase_Report.pdf");
  };

  const generateInvoicePDF = () => {
    if (!partyName || items.length === 0) {
      alert("⚠️ Fill Party and Items before generating invoice");
      return;
    }
    const doc = new jsPDF();
    doc.text(`Invoice - ${partyName}`, 14, 14);
    autoTable(doc, {
      startY: 25,
      head: [["Item", "Qty", "Unit", "UOM", "Rate", "Amount"]],
      body: items.map((i) => [
        i.itemName,
        i.qty,
        i.unit,
        i.uom,
        i.rate,
        i.amount.toFixed(2),
      ]),
    });
    doc.save(`Invoice_${invoiceNumber}.pdf`);
  };

  /* ---------------------- Filter ---------------------- */
  const filteredPurchases = purchases.filter((p) => {
    const partyMatch = p.partyName
      .toLowerCase()
      .includes(filter.party.toLowerCase());
    const fromDate = filter.from ? new Date(filter.from) : null;
    const toDate = filter.to ? new Date(filter.to) : null;
    const date = new Date(p.invoiceDate);
    return (
      partyMatch &&
      (!fromDate || date >= fromDate) &&
      (!toDate || date <= toDate)
    );
  });

  /* ---------------------- JSX ---------------------- */
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Purchase Entry</h1>
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
            Purchase Report
          </button>
        </div>

        {/* Entry Form */}
        {activeTab === "entry" && (
          <>
            <div className={styles.formSection}>
              {/* Party Details */}
              <div className={styles.formGroup}>
                <label>Party Name</label>
                <select
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                >
                  <option value="">-- Select Party --</option>
                  {partyNames.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            {/* Items Table */}
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Unit</th>
                    <th>UOM</th>
                    <th>Qty</th>
                    <th>Work Order No</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <select
                            value={item.itemName}
                            onChange={(e) =>
                              handleItemChange(i, "itemName", e.target.value)
                            }
                          >
                            <option value="">Select Item</option>
                            {savedItems.map((si, idx) => (
                              <option key={idx} value={si.itemName}>
                                {si.itemName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input type="text" value={item.unit} readOnly />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.uom}
                            onChange={(e) =>
                              handleItemChange(i, "uom", e.target.value)
                            }
                            placeholder="UOM"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(i, "qty", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.workOrderNumber}
                            onChange={(e) =>
                              handleItemChange(
                                i,
                                "workOrderNumber",
                                e.target.value
                              )
                            }
                            placeholder="Work Order No"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(i, "rate", e.target.value)
                            }
                          />
                        </td>
                        <td className={styles.amountCell}>
                          ₹{item.amount.toFixed(2)}
                        </td>
                        <td>
                          <button
                            className={styles.deleteButton}
                            onClick={() => removeItem(i)}
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

            <button className={styles.addButton} onClick={addItem}>
              + Add Item
            </button>

            {/* Totals */}
            <div className={styles.totalBar}>
              <span>Subtotal: ₹{totalInvoice.toFixed(2)}</span>

              <span>
                GST (%):
                <input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                  style={{
                    width: "60px",
                    marginLeft: "8px",
                    padding: "4px",
                  }}
                />
              </span>

              <span>GST Amount: ₹{gstAmount.toFixed(2)}</span>

              <span className={styles.totalAmount}>
                Total: ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            <div className={styles.bottomButtons}>
              <button className={styles.saveButton} onClick={handleSave}>
                {editingId ? "Update Record" : "Save Purchase"}
              </button>
              <button className={styles.pdfButton} onClick={generateInvoicePDF}>
                📄 Download Invoice PDF
              </button>
            </div>
          </>
        )}

        {/* Report Section */}
        {activeTab === "report" && (
          <>
            <h2 className={styles.title}>Purchase Report</h2>
            <div className={styles.filterSection}>
              <input
                type="text"
                placeholder="Search Party Name"
                value={filter.party}
                onChange={(e) =>
                  setFilter({ ...filter, party: e.target.value })
                }
              />
              <input
                type="date"
                value={filter.from}
                onChange={(e) => setFilter({ ...filter, from: e.target.value })}
              />
              <input
                type="date"
                value={filter.to}
                onChange={(e) => setFilter({ ...filter, to: e.target.value })}
              />
              <button className={styles.pdfButton} onClick={exportPDF}>
                Download PDF
              </button>
              <button className={styles.csvButton} onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            {/* Report Table */}
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Party Name</th>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total (₹)</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p) => (
                      <tr key={p._id || p.id}>
                        <td>{p.partyName}</td>
                        <td>{p.invoiceNumber}</td>
                        <td>{p.invoiceDate}</td>
                        <td>{p.items.map((i) => i.itemName).join(", ")}</td>
                        <td className={styles.amountCell}>
                          ₹{p.total.toFixed(2)}
                        </td>
                        <td>
                          <button
                            className={styles.addButton}
                            onClick={() => handleEdit(p)}
                          >
                            Edit
                          </button>
                        </td>
                        <td>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(p._id)}
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

            <button className={styles.backButton} onClick={() => router.back()}>
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
//updated delete button
