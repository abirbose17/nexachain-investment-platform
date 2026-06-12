import { useFetch } from "../hooks/useFetch";
import { dashboardApi } from "../services/api";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import styles from "./DashboardPage.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);

const STAT_CARDS = (data) => [
  { label: "Wallet Balance",      value: fmt(data?.wallet?.balance),                icon: "💳", color: "#6c63ff" },
  { label: "Total ROI Earned",    value: fmt(data?.wallet?.totalRoiEarned),          icon: "📈", color: "#00d4aa" },
  { label: "Level Income",        value: fmt(data?.wallet?.totalLevelIncomeEarned),  icon: "🤝", color: "#ffd93d" },
  { label: "Total Earned",        value: fmt(data?.wallet?.totalEarned),             icon: "💎", color: "#ff6b6b" },
  { label: "Active Investments",  value: data?.investments?.active ?? 0,             icon: "🔄", color: "#6c63ff" },
  { label: "Completed",           value: data?.investments?.completed ?? 0,          icon: "✅", color: "#00d4aa" },
  { label: "Cancelled",           value: data?.investments?.cancelled ?? 0,          icon: "❌", color: "#ff6b6b" },
  { label: "Total Invested",      value: fmt(data?.investments?.totalInvested),      icon: "📊", color: "#ffd93d" },
];

export default function DashboardPage() {
  const { data, loading, error } = useFetch(dashboardApi.getStats);

  if (loading) return <Spinner />;
  if (error)   return <div className={styles.error}>{error}</div>;

  const roiChartData = (data?.recentRoi || [])
    .slice()
    .reverse()
    .map((r) => ({
      date:   new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      roi:    r.roiAmount,
    }));

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.sub}>Your portfolio at a glance</p>

      {/* ── Stat cards ── */}
      <div className={styles.grid}>
        {STAT_CARDS(data).map(({ label, value, icon, color }) => (
          <Card key={label} className={styles.statCard}>
            <div className={styles.cardIcon} style={{ background: `${color}22`, color }}>
              {icon}
            </div>
            <div>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── ROI chart ── */}
      <Card className={styles.chartCard}>
        <h2 className={styles.cardTitle}>Recent ROI Credits</h2>
        <p className={styles.cardSub}>Last 5 credited ROI payments across all investments</p>
        {roiChartData.length === 0 ? (
          <p className={styles.empty}>No ROI history yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={roiChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3354" />
              <XAxis dataKey="date" tick={{ fill: "#8892b0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8892b0", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#1a1d27", border: "1px solid #2e3354", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#8892b0" }}
                formatter={(v) => [`$${v.toFixed(2)}`, "ROI"]}
              />
              <Area type="monotone" dataKey="roi" stroke="#6c63ff" strokeWidth={2} fill="url(#roiGrad)" dot={{ r: 4, fill: "#6c63ff" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Recent ROI table ── */}
      <Card className={styles.tableCard}>
        <h2 className={styles.cardTitle}>Recent ROI History</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentRoi || []).map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td className={styles.green}>{fmt(r.roiAmount)}</td>
                  <td><span className={styles.badgeGreen}>{r.status}</span></td>
                </tr>
              ))}
              {!data?.recentRoi?.length && (
                <tr><td colSpan={3} className={styles.empty}>No ROI records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
