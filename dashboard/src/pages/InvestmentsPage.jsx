import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { investmentApi } from "../services/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import styles from "./TablePage.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function InvestmentsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage]     = useState(1);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount]     = useState("");
  const [createErr, setCreateErr] = useState("");
  const [createOk, setCreateOk]   = useState("");

  const { data, loading, error, refetch } = useFetch(
    () => investmentApi.getAll({ status: status || undefined, page, limit: 10 }),
    [status, page]
  );

  const { data: plansData } = useFetch(investmentApi.getPlans);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateErr(""); setCreateOk("");
    setCreating(true);
    try {
      await investmentApi.create({ amount: Number(amount) });
      setCreateOk("Investment created successfully!");
      setAmount("");
      refetch();
    } catch (err) {
      setCreateErr(err.response?.data?.message || "Failed to create investment.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Investments</h1>

      {/* ── Plans ── */}
      <div className={styles.planGrid}>
        {(plansData?.plans || []).map((p) => (
          <Card key={p.name} className={styles.planCard}>
            <div className={styles.planName}>{p.name}</div>
            <div className={styles.planRoi}>{p.dailyRoiPercent}% <span>/ day</span></div>
            <div className={styles.planMeta}>
              {fmt(p.minAmount)} – {p.maxAmount ? fmt(p.maxAmount) : "∞"}
            </div>
            <div className={styles.planDur}>{p.durationDays} days</div>
          </Card>
        ))}
      </div>

      {/* ── Create ── */}
      <Card className={styles.createCard}>
        <h2 className={styles.cardTitle}>New Investment</h2>
        <p className={styles.cardSub}>Plan is auto-selected based on the amount you enter.</p>
        {createErr && <div className={styles.error}>{createErr}</div>}
        {createOk  && <div className={styles.success}>{createOk}</div>}
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            className={styles.input}
            type="number"
            min="100"
            placeholder="Amount (min $100)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit" loading={creating}>Invest Now</Button>
        </form>
      </Card>

      {/* ── Table ── */}
      <Card>
        <div className={styles.tableHeader}>
          <h2 className={styles.cardTitle}>Investment History</h2>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <Spinner /> : error ? <div className={styles.error}>{error}</div> : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Daily ROI</th>
                    <th>ROI Paid</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.investments || []).map((inv) => (
                    <tr key={inv._id}>
                      <td><strong>{inv.plan?.name}</strong></td>
                      <td>{fmt(inv.amount)}</td>
                      <td className={styles.accent}>{inv.dailyRoiPercent}%</td>
                      <td className={styles.green}>{fmt(inv.totalRoiPaid)}</td>
                      <td>{new Date(inv.startDate).toLocaleDateString()}</td>
                      <td>{new Date(inv.endDate).toLocaleDateString()}</td>
                      <td><Badge label={inv.status} /></td>
                    </tr>
                  ))}
                  {!data?.investments?.length && (
                    <tr><td colSpan={7} className={styles.empty}>No investments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span className={styles.pageInfo}>Page {page} of {data.pagination.totalPages}</span>
                <Button variant="ghost" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
