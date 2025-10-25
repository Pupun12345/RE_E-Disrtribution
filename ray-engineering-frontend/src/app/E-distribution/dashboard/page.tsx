"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import Image from "next/image";

interface Stats {
  pendingOrders: number;
  acceptedOrders: number;
  rfqs: number;
}

interface MenuSection {
  title: string;
  features: string[];
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(
    {}
  );
  const router = useRouter();

  // ✅ Sidebar menu structure
  const menuSections: MenuSection[] = [
    {
      title: "Vendor Registration",
      features: ["Registration"],
    },
    {
      title: "PPE",
      features: [
        "Registration",
        "Purchase Entry",
        "Distribution Materials",
        "Stock Report",
      ],
    },
    {
      title: "Mechanical Tools",
      features: [
        "Registration",
        "Purchase Entry",
        "Distribution Materials",
        "Return",
        "Stock Report",
      ],
    },
    {
      title: "Scaffolding Materials",
      features: [
        "Registration",
        "Purchase Entry",
        "Distribution Materials",
        "Return",
        "Stock Report",
      ],
    },
  ];

  // ✅ Load user info
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("username");

    if (!storedRole) {
      router.push("/E-distribution/login");
      return;
    }

    setRole(storedRole);
    setUsername(storedUser);

    // Mock stats
    setTimeout(() => {
      setStats({ pendingOrders: 15, acceptedOrders: 45, rfqs: 20 });
    }, 300);
  }, [router]);

  if (!role) return null;

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.clear();
    router.push("/E-distribution/login");
  };

  // ✅ Fixed Route Logic
  const getTabLink = (sectionTitle: string, feature: string) => {
    if (sectionTitle === "Vendor Registration") {
      return "/E-distribution/Vendor_Registration"; // ✅ fixed with leading slash
    }

    if (sectionTitle === "PPE") {
      if (feature === "Registration") return "/E-distribution/ppe/registration";
      if (feature === "Purchase Entry")
        return "/E-distribution/ppe/purchase_entry";
      if (feature === "Distribution Materials")
        return "/E-distribution/ppe/distribution";
      if (feature === "Stock Report") return "/E-distribution/ppe/stockreport";
    }

    if (sectionTitle === "Mechanical Tools") {
      if (feature === "Registration")
        return "/E-distribution/Mechanicals/registration";
      if (feature === "Purchase Entry")
        return "/E-distribution/Mechanicals/purchase";
      if (feature === "Distribution Materials")
        return "/E-distribution/Mechanicals/distribution";
      if (feature === "Stock Report")
        return "/E-distribution/Mechanicals/stock";
      if (feature === "Return") return "/E-distribution/Mechanicals/return";
    }

    if (sectionTitle === "Scaffolding Materials") {
      if (feature === "Registration")
        return "/E-distribution/scaffolding/registration";
      if (feature === "Purchase Entry")
        return "/E-distribution/scaffolding/purchase_entry";
      if (feature === "Distribution Materials")
        return "/E-distribution/scaffolding/distribution";
      if (feature === "Stock Report")
        return "/E-distribution/scaffolding/stock_report";
      if (feature === "Return") return "/E-distribution/scaffolding/return";
    }

    return "#";
  };

  // ✅ Render
  return (
    <div className={styles.container}>
      {/* ===== Sidebar ===== */}
      <aside className={styles.sidebar}>
        <div>
          <h2 className={styles.logo}>EPROC</h2>

          <div className={styles.profile}>
            <div className={styles.avatar}>
              <Image
                src="/ray-log.png" // <-- use your logo file path
                alt="Ray Engineering Logo"
                width={60}
                height={60}
                className={styles.avatarImage}
              />
            </div>

            <p className={styles.company}>Ray Engineering</p>
            <span className={styles.id}>R306</span>
          </div>

          <ul className={styles.menu}>
            <li>
              <Link href="/E-distribution/dashboard">HOME</Link>
            </li>

            <li className={styles.sectionHeader}>ADMIN ACCOUNT</li>

            {menuSections.map((section, index) => (
              <li key={index}>
                <details
                  className={styles.detailsWrapper}
                  onToggle={(e) => {
                    const isOpen = (e.target as HTMLDetailsElement).open;
                    setOpenSections((prev) => ({
                      ...prev,
                      [section.title]: isOpen,
                    }));
                  }}
                >
                  <summary>
                    <span className={styles.summaryTitle}>{section.title}</span>
                    <svg
                      className={styles.chev}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>

                  <ul>
                    {section.features.map((feature, idx) => (
                      <li key={idx} className={styles.feature}>
                        <Link
                          href={getTabLink(section.title, feature)}
                          className={styles.linkHighlight}
                        >
                          {feature}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}

            <li>
              <button onClick={handleLogout} className={styles.logout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <input
            type="text"
            placeholder="Search..."
            className={styles.search}
          />
          <div className={styles.admin}>
            <span>👤</span> {role === "admin" ? "Admin" : username}
          </div>
        </div>

        <h1 className={styles.title}>
          Welcome, {role === "admin" ? "Admin 👑" : `${username} 🎉`}
        </h1>

        <p className={styles.subtitle}>
          {role === "admin"
            ? "You have full access to Vendors, Reports, Orders, and Settings."
            : "You have access to your Profile and Dashboard."}
        </p>

        {/* ===== Dashboard Cards ===== */}
        <div className={styles.contentGrid}>
          <div
            className={`${styles.card} ${styles.cyan}`}
            onClick={() => router.push("/E-distribution/ppe/registration")}
          >
            <h4>PPE</h4>
            <div className={styles.cardContent}>
              <ul>
                <li>Registration/Edit Gateway</li>
                <li>Distribution / Reports</li>
                <li>Stock Report</li>
              </ul>
              <ul>
                <li>Purchase Entry</li>
                <li>30 days summary</li>
              </ul>
            </div>
          </div>

          <div className={`${styles.stat} ${styles.blue}`}>
            <p>PENDING ORDERS</p>
            <h2>{stats?.pendingOrders ?? "..."}</h2>
          </div>

          <div
            className={`${styles.card} ${styles.green}`}
            onClick={() =>
              router.push("/E-distribution/mechanical/registration")
            }
          >
            <h4>MECHANICAL TOOLS</h4>
            <div className={styles.cardContent}>
              <ul>
                <li>Registration/Edit Gateway</li>
                <li>Distribution / Reports</li>
                <li>Stock Report</li>
              </ul>
              <ul>
                <li>Purchase Entry</li>
                <li>30 days summary</li>
              </ul>
            </div>
          </div>

          <div className={`${styles.stat} ${styles.greenBorder}`}>
            <p>ACCEPTED ORDERS</p>
            <h2>{stats?.acceptedOrders ?? "..."}</h2>
          </div>

          <div
            className={`${styles.card} ${styles.orange}`}
            onClick={() =>
              router.push("/E-distribution/scaffolding/registration")
            }
          >
            <h4>SCAFFOLDING MATERIALS</h4>
            <div className={styles.cardContent}>
              <ul>
                <li>Registration/Edit Gateway</li>
                <li>Distribution / Reports</li>
                <li>Stock Report</li>
              </ul>
              <ul>
                <li>Purchase Entry</li>
                <li>30 days summary</li>
              </ul>
            </div>
          </div>

          <div className={`${styles.stat} ${styles.red}`}>
            <p>RFQs</p>
            <h2>{stats?.rfqs ?? "..."}</h2>
          </div>
        </div>

        <footer className={styles.footer}>
          © 2025 EPROC System | All Rights Reserved
        </footer>
      </main>
    </div>
  );
}
