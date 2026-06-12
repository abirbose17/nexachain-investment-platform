import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import styles from "./Auth.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    fullName: "", email: "", mobile: "", password: "", referralCode: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.referralCode) delete payload.referralCode;
      const res = await authApi.register(payload);
      const { token, user } = res.data.data;
      setAuth(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>NexaChain</span>
        </div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Join the NexaChain investment platform</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {[
            { name: "fullName",  label: "Full Name",     type: "text",     ph: "Alice Sharma" },
            { name: "email",     label: "Email",         type: "email",    ph: "alice@example.com" },
            { name: "mobile",    label: "Mobile",        type: "text",     ph: "+919876543210" },
            { name: "password",  label: "Password",      type: "password", ph: "Min. 6 characters" },
            { name: "referralCode", label: "Referral Code (optional)", type: "text", ph: "ALICE001" },
          ].map(({ name, label, type, ph }) => (
            <label key={name} className={styles.label}>
              {label}
              <input
                className={styles.input}
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={ph}
                required={name !== "referralCode"}
              />
            </label>
          ))}
          <Button type="submit" loading={loading} full>Create Account</Button>
        </form>

        <p className={styles.switch}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
