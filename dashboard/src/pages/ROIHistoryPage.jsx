import { useFetch } from "../hooks/useFetch";
import { investmentApi } from "../services/api";
import { dashboardApi } from "../services/api";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import styles from "./TablePage.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function ROIHistoryPage() {
  const { data: invData, loading: il } = useFetch(() => investmentApi.getAll({ status: "Active", limit: 50 }));
  const { data: dash, loading: dl }    = useFetch(dashboardApi.getStats);

  const roiChartData = (dash?.recentRoi || [])
    .slice().reverse()
    .map((r) => ({
      date:   new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: r.roiAmount,
    }));

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>ROI History</h1>

      {/* ── Bar chart ── */}
      <Card className={styles.mb}>
        <h2 className={styles.cardTitle}>ROI Credit History</h2>
        {dl ? <Spinner /> : roiChartData.length === 0 ? (
          <p className={styles.empty}>No ROI history yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={roiChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3354" />
              <XAxis dataKey="date" tick={{ fill: "#8892b0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8892b0", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#1a1d27", border: "1px solid #2e3354", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${v.toFixed(2)}`, "ROI Credited"]}
              />
              <Bar dataKey="amount" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Active investments table ── */}
      <Card>
        <h2 className={styles.cardTitle}>Active Investments</h2>
        {il ? <Spinner /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Plan</th><th>Amount</th><th>Daily ROI</th><th>ROI Paid</th><th>End Date</th><th>Status</th></tr></thead>
              <tbody>
                {(invData?.investments || []).map((inv) => (
                  <tr key={inv._id}>
                    <td><strong>{inv.plan?.name}</strong></td>
                    <td>{fmt(inv.amount)}</td>
                    <td className={styles.accent}>{fmt((inv.amount * inv.dailyRoiPercent) / 100)}</td>
                    <td className={styles.green}>{fmt(inv.totalRoiPaid)}</td>
                    <td>{new Date(inv.endDate).toLocaleDateString()}</td>
                    <td><Badge label={inv.status} /></td>
                  </tr>
                ))}
                {!invData?.investments?.length && <tr><td colSpan={6} className={styles.empty}>No active investments.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
