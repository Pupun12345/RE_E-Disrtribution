"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./dashboard.module.css";

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
    { title: "Vendor Registration", features: ["Registration"] },
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

    // Mock stats for now
    setTimeout(() => {
      setStats({ pendingOrders: 15, acceptedOrders: 45, rfqs: 20 });
    }, 400);
  }, [router]);

  if (!role) return null;

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    router.push("/E-distribution/login");
  };

  // ✅ Link routing logic
  const getTabLink = (sectionTitle: string, feature: string) => {
    const base = "/E-distribution";
    switch (sectionTitle) {
      case "Vendor Registration":
        return `${base}/Vendor_Registration`;
      case "PPE":
        if (feature === "Registration") return `${base}/ppe/registration`;
        if (feature === "Purchase Entry") return `${base}/ppe/purchase_entry`;
        if (feature === "Distribution Materials")
          return `${base}/ppe/distribution`;
        if (feature === "Stock Report") return `${base}/ppe/stockreport`;
        break;
      case "Mechanical Tools":
        if (feature === "Registration")
          return `${base}/Mechanicals/registration`;
        if (feature === "Purchase Entry") return `${base}/Mechanicals/purchase`;
        if (feature === "Distribution Materials")
          return `${base}/Mechanicals/distribution`;
        if (feature === "Return") return `${base}/Mechanicals/return`;
        if (feature === "Stock Report") return `${base}/Mechanicals/stock`;
        break;
      case "Scaffolding Materials":
        if (feature === "Registration")
          return `${base}/scaffolding/registration`;
        if (feature === "Purchase Entry")
          return `${base}/scaffolding/purchase_entry`;
        if (feature === "Distribution Materials")
          return `${base}/scaffolding/distribution`;
        if (feature === "Return") return `${base}/scaffolding/return`;
        if (feature === "Stock Report")
          return `${base}/scaffolding/stock_report`;
        break;
      default:
        return "#";
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
                src="/ray-log.png"
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
              <button
                onClick={() => {
                  router.push("/E-distribution/dashboard");
                  window.location.reload();
                }}
                className={styles.homeButton}
              >
                HOME
              </button>
            </li>

            {/* ✅ Collapsible Menu Section */}
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
            {role === "admin" && (
              <li>
                <Link
                  href="/E-distribution/change-password"
                  className={styles.linkHighlight}
                >
                  Change Password
                </Link>
              </li>
            )}

            <li>
              <button onClick={handleLogout} className={styles.logout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* ===== Main Section with Video Background ===== */}
      <main className={styles.mainVideoSection}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className={styles.backgroundVideo}
        >
          <source
            src="https://res.cloudinary.com/dvforffjb/video/upload/f_auto,q_auto/v1762849167/video_ztsjcp.mp4"
            type="video/mp4"
          />
          {/* Your browser does not support the video tag. */}
        </video>

        <div className={styles.overlayContent}>
          <div className={styles.centerContent}>
            <h1 className={styles.title}>
              Welcome, {role === "admin" ? "Admin 👑" : `${username} 🎉`}
            </h1>

            <h2 className={styles.videoHeading}>Ray Engineering</h2>
            <p className={styles.procurementSubtitle}>E-Procurement System</p>

            <p className={styles.subtitle}>
              {role === "admin"
                ? ""
                : "You have access to your Profile and Dashboard."}
            </p>
          </div>

          <footer className={styles.footer}>
            © RE-EPROC System | Developed by SMARTNEX Technologies
          </footer>
        </div>
      </main>
    </div>
  );
}
