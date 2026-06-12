import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { referralApi } from "../services/api";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import styles from "./TablePage.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const LEVEL_COLORS = ["", "#6c63ff", "#00d4aa", "#ffd93d", "#ff6b6b", "#8892b0"];

export default function ReferralsPage() {
  const [page, setPage] = useState(1);
  const { data: directData, loading: dl } = useFetch(referralApi.getDirect);
  const { data: earningsData, loading: el, refetch } = useFetch(
    () => referralApi.getEarnings({ page, limit: 10 }),
    [page]
  );

  const totalEarned = (earningsData?.earnings || []).reduce((s, e) => s + e.incomeAmount, 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Referrals</h1>

      {/* ── Direct referrals ── */}
      <Card className={styles.mb}>
        <h2 className={styles.cardTitle}>Direct Referrals ({directData?.count ?? 0})</h2>
        {dl ? <Spinner /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Email</th><th>Code</th><th>Wallet</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {(directData?.referrals || []).map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td className={styles.muted}>{u.email}</td>
                    <td><code className={styles.code}>{u.referralCode}</code></td>
                    <td className={styles.green}>{fmt(u.walletBalance)}</td>
                    <td><span className={styles.badgeGreen}>{u.accountStatus}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!directData?.referrals?.length && <tr><td colSpan={6} className={styles.empty}>No direct referrals yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Earnings ── */}
      <Card>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.cardTitle}>Level Income Earnings</h2>
            {earningsData?.earnings?.length > 0 && (
              <p className={styles.cardSub}>Total this page: {fmt(totalEarned)}</p>
            )}
          </div>
        </div>
        {el ? <Spinner /> : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Level</th><th>From</th><th>Investment</th><th>Income</th><th>Date</th></tr></thead>
                <tbody>
                  {(earningsData?.earnings || []).map((e) => (
                    <tr key={e._id}>
                      <td>
                        <span style={{ color: LEVEL_COLORS[e.level] || "#fff", fontWeight: 700 }}>
                          L{e.level}
                        </span>
                      </td>
                      <td>{e.fromUser?.fullName || "—"}</td>
                      <td className={styles.muted}>{fmt(e.investment?.amount)} · {e.investment?.plan?.name}</td>
                      <td className={styles.green}>{fmt(e.incomeAmount)}</td>
                      <td>{new Date(e.creditDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!earningsData?.earnings?.length && <tr><td colSpan={5} className={styles.empty}>No earnings yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {earningsData?.pagination?.totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pgBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className={styles.pageInfo}>Page {page} of {earningsData.pagination.totalPages}</span>
                <button className={styles.pgBtn} disabled={page >= earningsData.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
