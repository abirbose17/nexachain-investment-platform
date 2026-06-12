import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import styles from "./Layout.module.css";

const NAV = [
  { to: "/dashboard",          icon: "⊞",  label: "Dashboard" },
  { to: "/investments",        icon: "💰", label: "Investments" },
  { to: "/roi-history",        icon: "📈", label: "ROI History" },
  { to: "/referrals",          icon: "🤝", label: "Referrals" },
  { to: "/referral-tree",      icon: "🌳", label: "Referral Tree" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>NexaChain</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.active : ""].join(" ")
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.fullName?.[0] || "U"}</div>
            <div>
              <div className={styles.userName}>{user?.fullName}</div>
              <div className={styles.userCode}>#{user?.referralCode}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            ↪ Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
