import styles from "./Badge.module.css";

const colorMap = {
  Active:    "green",
  Completed: "blue",
  Cancelled: "red",
  Credited:  "green",
  Pending:   "yellow",
  Failed:    "red",
};

export default function Badge({ label }) {
  const color = colorMap[label] || "gray";
  return <span className={[styles.badge, styles[color]].join(" ")}>{label}</span>;
}
