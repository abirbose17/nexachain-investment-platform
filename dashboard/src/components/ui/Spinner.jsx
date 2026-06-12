import styles from "./Spinner.module.css";

export default function Spinner({ size = 40 }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.ring} style={{ width: size, height: size }} />
    </div>
  );
}
