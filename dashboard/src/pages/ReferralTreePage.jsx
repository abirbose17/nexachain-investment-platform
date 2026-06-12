import { useFetch } from "../hooks/useFetch";
import { referralApi } from "../services/api";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import styles from "./ReferralTreePage.module.css";

const LEVEL_COLORS = ["", "#6c63ff", "#00d4aa", "#ffd93d", "#ff6b6b", "#8892b0"];

function MemberNode({ member }) {
  return (
    <div className={styles.node}>
      <div className={styles.avatar}>{member.fullName?.[0]}</div>
      <div>
        <div className={styles.name}>{member.fullName}</div>
        <div className={styles.code}>{member.referralCode}</div>
      </div>
    </div>
  );
}

export default function ReferralTreePage() {
  const { data, loading, error } = useFetch(referralApi.getTree);

  if (loading) return <Spinner />;
  if (error)   return <div style={{ color: "var(--danger)", padding: 20 }}>{error}</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Referral Tree</h1>
      <p className={styles.sub}>{data?.totalLevels || 0} active level(s) in your network</p>

      {(!data?.tree || data.tree.length === 0) ? (
        <Card><p className={styles.empty}>You have no referrals yet. Share your referral code to start earning!</p></Card>
      ) : (
        data.tree.map((lvl) => (
          <div key={lvl.level} className={styles.level}>
            <div className={styles.levelHeader} style={{ borderColor: LEVEL_COLORS[lvl.level] }}>
              <span className={styles.levelBadge} style={{ background: LEVEL_COLORS[lvl.level] }}>
                Level {lvl.level}
              </span>
              <span className={styles.levelCount}>{lvl.count} member{lvl.count !== 1 ? "s" : ""}</span>
            </div>
            <div className={styles.members}>
              {lvl.members.map((m) => (
                <MemberNode key={m._id} member={m} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
