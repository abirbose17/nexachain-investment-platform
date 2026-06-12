import styles from "./Button.module.css";

const variants = { primary: "primary", ghost: "ghost", danger: "danger" };

export default function Button({ children, variant = "primary", loading, full, ...props }) {
  return (
    <button
      className={[
        styles.btn,
        styles[variants[variant] || "primary"],
        full ? styles.full : "",
      ].join(" ")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
