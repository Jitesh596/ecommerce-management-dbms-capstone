import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // Login form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register extra fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError("Name is required for registration.");
          setLoading(false);
          return;
        }
        const res = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone,
          address
        });
        if (res.success) {
          navigate(redirectTo);
        } else {
          setError(res.error || "Registration failed.");
        }
      } else {
        const res = await login(email.trim().toLowerCase(), password);
        if (res.success) {
          navigate(redirectTo);
        } else {
          setError(res.error || "Invalid email or password.");
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
  };

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
        <div id="loginBox" style={{ width: "420px", maxWidth: "100%", padding: "35px" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "5px" }}>
            {isRegistering ? "Create an Account" : "Welcome Back"}
          </h1>
          <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
            {isRegistering ? "Register as a customer in MySQL database" : "Sign in to access your orders and cart"}
          </p>

          {error && (
            <div className="alert-box alert-error" style={{ textAlign: "left" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            {isRegistering && (
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password (min 6 chars) *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegistering && (
              <>
                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876500000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="City, State, PIN"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", marginTop: "15px", padding: "12px", fontSize: "15px" }}
            >
              {loading ? "Authenticating..." : isRegistering ? "Register Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div style={{ marginTop: "20px", fontSize: "13px" }}>
            {isRegistering ? (
              <span>
                Already have an account?{" "}
                <button
                  onClick={() => { setIsRegistering(false); setError(""); }}
                  style={{ background: "none", border: "none", color: "#2980b9", fontWeight: "bold", cursor: "pointer" }}
                >
                  Sign In here
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  onClick={() => { setIsRegistering(true); setError(""); }}
                  style={{ background: "none", border: "none", color: "#2980b9", fontWeight: "bold", cursor: "pointer" }}
                >
                  Create one now
                </button>
              </span>
            )}
          </div>

          {/* Demonstration Quick Fill Box for Evaluation */}
          <div style={{ marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "15px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", textTransform: "uppercase", marginBottom: "8px" }}>
              Academic Evaluation Quick Fill
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => handleQuickLogin("rahul@example.com", "Password@123")}
                style={{ padding: "6px 10px", fontSize: "11px", border: "1px solid #ccc", borderRadius: "15px", background: "#fafafa", cursor: "pointer" }}
              >
                👤 Demo Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@fashionista.com", "Admin@123")}
                style={{ padding: "6px 10px", fontSize: "11px", border: "1px solid #222", borderRadius: "15px", background: "#222", color: "white", cursor: "pointer" }}
              >
                ⚙️ Demo Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;
