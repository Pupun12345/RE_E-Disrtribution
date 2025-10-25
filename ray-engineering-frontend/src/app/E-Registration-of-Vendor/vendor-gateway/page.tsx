"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFilter } from "react-icons/fa";
import styles from "./VendorGateway.module.css";
import { all_routes } from "@/data/allroutes";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Party {
  id: string;
  name: string;
  address: string;
  gst: string;
  contact: string;
  publishedDate?: string;
}

export default function VendorGateway() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <VendorGatewayPage />
    </ProtectedRoute>
  );
}

function VendorGatewayPage() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter states
  const [gstFilter, setGstFilter] = useState<string>("");
  const [contactFilter, setContactFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    gst: "",
    contact: "",
    start: null as Date | null,
    end: null as Date | null,
  });

  // ✅ Fetch vendors with token
  useEffect(() => {
    const fetchVendors = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please login again.");
        router.push("/E-distribution/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/api/vendors", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errText = await res.text();
          alert(`Access denied: ${errText}`);
          return;
        }

        const data = await res.json();
        const vendorList: any[] = Array.isArray(data)
          ? data
          : data.vendors || [];

        setParties(
          vendorList.map((v: any) => ({
            id: v._id,
            name: v.partyName,
            address: v.address,
            gst: v.gstNumber,
            contact: v.contactNumber,
            publishedDate: v.publishedDate
              ? new Date(v.publishedDate).toISOString().split("T")[0]
              : "",
          }))
        );
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }
    };

    fetchVendors();
  }, [router]);

  // Delete vendor
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:4000/api/vendors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        alert(`Delete failed: ${errText}`);
        return;
      }
      alert("Vendor deleted successfully!");
      setParties((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Server Error");
    }
  };

  // Edit handlers
  const handleEdit = (party: Party) => setEditingParty({ ...party });

  const handleSaveEdit = async () => {
    if (!editingParty) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:4000/api/vendors/${editingParty.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            partyName: editingParty.name,
            address: editingParty.address,
            gstNumber: editingParty.gst,
            contactNumber: editingParty.contact,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        alert(`Update failed: ${errText}`);
        return;
      }
      alert("Vendor updated successfully!");
      setParties((prev) =>
        prev.map((p) => (p.id === editingParty.id ? { ...editingParty } : p))
      );
      setEditingParty(null);
    } catch (error) {
      console.error("Error updating vendor:", error);
      alert("Server Error");
    }
  };

  // CSV Download
  const handleDownload = () => {
    const headers = ["Party Name", "Address", "GST", "Contact", "Published Date"];
    const rows = parties.map((p) => [
      p.name,
      p.address,
      p.gst,
      p.contact,
      p.publishedDate || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "vendors.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const handlePreset = (days: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    setStartDate(past);
    setEndDate(today);
  };

  const handleSubmitFilter = () => {
    setAppliedFilters({
      gst: gstFilter,
      contact: contactFilter,
      start: startDate,
      end: endDate,
    });
    setShowFilter(false);
  };

  const filteredParties = parties.filter((party) => {
    const matchesSearch = party.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGst = appliedFilters.gst
      ? party.gst.toLowerCase().includes(appliedFilters.gst.toLowerCase())
      : true;
    const matchesContact = appliedFilters.contact
      ? party.contact.includes(appliedFilters.contact)
      : true;
    let matchesDate = true;
    if (appliedFilters.start && appliedFilters.end && party.publishedDate) {
      const pubDate = new Date(party.publishedDate);
      matchesDate =
        pubDate >= appliedFilters.start && pubDate <= appliedFilters.end;
    }
    return matchesSearch && matchesGst && matchesContact && matchesDate;
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.innerContainer}>
        <h1 className={styles.vendorTitle}>Vendor Gateway</h1>

        {/* Top Controls */}
        <div className={styles.topBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by party name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className={styles.buttonGroup}>
            <Link
              href={all_routes.VendorRegistration}
              className={`${styles.actionBtn} ${styles.vendorBtn}`}
            >
              Vendor Registration
            </Link>

            <button
              className={`${styles.actionBtn} ${styles.downloadBtn}`}
              onClick={handleDownload}
            >
              Download CSV
            </button>

            <button
              className={`${styles.actionBtn} ${styles.filterBtn}`}
              onClick={() => setShowFilter(true)}
            >
              <FaFilter className={styles.filterIcon} /> Filter
            </button>
          </div>
        </div>

        {/* Vendor Table */}
        <div className={styles.partyList}>
          <h2>Party List</h2>
          {filteredParties.length > 0 ? (
            <table className={styles.partyTable}>
              <thead>
                <tr>
                  <th>Party Name</th>
                  <th>Address</th>
                  <th>GST</th>
                  <th>Contact</th>
                  <th>Published Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((party) => (
                  <tr key={party.id}>
                    <td>{party.name}</td>
                    <td>{party.address}</td>
                    <td>{party.gst}</td>
                    <td>{party.contact}</td>
                    <td>{party.publishedDate}</td>
                    <td>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEdit(party)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(party.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No vendors found</p>
          )}
        </div>

        {/* Edit Modal */}
        {editingParty && (
          <div
            className={styles.formOverlay}
            onClick={() => setEditingParty(null)}
          >
            <div
              className={styles.formCard}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Vendor Details</h3>
              <label>Party Name</label>
              <input
                type="text"
                value={editingParty.name}
                onChange={(e) =>
                  setEditingParty({ ...editingParty, name: e.target.value })
                }
              />
              <label>Address</label>
              <input
                type="text"
                value={editingParty.address}
                onChange={(e) =>
                  setEditingParty({ ...editingParty, address: e.target.value })
                }
              />
              <label>GST</label>
              <input
                type="text"
                value={editingParty.gst}
                onChange={(e) =>
                  setEditingParty({ ...editingParty, gst: e.target.value })
                }
              />
              <label>Contact</label>
              <input
                type="text"
                value={editingParty.contact}
                onChange={(e) =>
                  setEditingParty({ ...editingParty, contact: e.target.value })
                }
              />
              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={handleSaveEdit}>
                  Save
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setEditingParty(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {showFilter && (
          <div
            className={styles.formOverlay}
            onClick={() => setShowFilter(false)}
          >
            <div
              className={`${styles.formCard} ${styles.scrollableModal}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Advanced Filters</h3>

              <input
                type="text"
                className={styles.filterInput}
                placeholder="Filter by GST..."
                value={gstFilter}
                onChange={(e) => setGstFilter(e.target.value)}
              />

              <input
                type="text"
                className={styles.filterInput}
                placeholder="Filter by Contact..."
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
              />

              <h4>Filter by Published Date</h4>
              <div className={styles.presetBtns}>
                <button onClick={() => handlePreset(0)}>Today</button>
                <button onClick={() => handlePreset(7)}>Last 7 Days</button>
                <button onClick={() => handlePreset(30)}>This Month</button>
              </div>

              <div className={styles.datePickers}>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="End Date"
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={handleSubmitFilter}>
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
