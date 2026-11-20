import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill all required fields.");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            if (isRegister) {
                if (!name.trim()) {
                    setError("Please enter your full name.");
                    setLoading(false);
                    return;
                }
                await register({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    phone: phone.trim(),
                    address: address.trim()
                });
            } else {
                await login(email.trim(), password);
            }

            // Successfully authenticated
            navigate(redirectPath);
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.response?.data?.error || "Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    // Quick demo login fill helper
    const fillDemoUser = (role) => {
        if (role === "admin") {
            setEmail("admin@fashionista.com");
            setPassword("admin123");
            setIsRegister(false);
        } else {
            setEmail("customer@fashionista.com");
            setPassword("password123");
            setIsRegister(false);
        }
    };

    return (
        <div id="loginPage" style={{ minHeight: "100vh", padding: "20px" }}>
            <div id="loginBox" style={{ maxWidth: "420px", width: "100%" }}>
                <Link to="/" style={{ textDecoration: "none", color: "black", display: "inline-block", marginBottom: "15px" }}>
                    <h2 style={{ letterSpacing: "2px", fontWeight: "900", margin: 0 }}>FASHIONISTA</h2>
                </Link>

                {/* Tab switch between Sign In and Create Account */}
                <div style={{ display: "flex", gap: "10px", margin: "15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                    <button
                        type="button"
                        onClick={() => { setIsRegister(false); setError(""); }}
                        style={{
                            flex: 1,
                            padding: "8px",
                            border: "none",
                            background: "none",
                            borderBottom: !isRegister ? "2px solid #111" : "none",
                            fontWeight: !isRegister ? "bold" : "normal",
                            color: !isRegister ? "#111" : "#888",
                            cursor: "pointer",
                            fontSize: "15px"
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsRegister(true); setError(""); }}
                        style={{
                            flex: 1,
                            padding: "8px",
                            border: "none",
                            background: "none",
                            borderBottom: isRegister ? "2px solid #111" : "none",
                            fontWeight: isRegister ? "bold" : "normal",
                            color: isRegister ? "#111" : "#888",
                            cursor: "pointer",
                            fontSize: "15px"
                        }}
                    >
                        Register
                    </button>
                </div>

                <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
                <p style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
                    {isRegister ? "Join Fashionista to unlock wishlist, orders & discounts." : "Log in to your Fashionista shopping account."}
                </p>

                {error && (
                    <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginTop: "15px", fontSize: "13px", fontWeight: "bold" }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <input
                            type="text"
                            placeholder="Full Name *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password (min 6 chars) *"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {isRegister && (
                        <>
                            <input
                                type="tel"
                                placeholder="Phone Number (optional)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />

                            <input
                                type="text"
                                placeholder="Shipping Address (optional)"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Processing..." : isRegister ? "Register Account" : "Sign In"}
                    </button>
                </form>

                {/* Demo Accounts Quick Login Fill Box */}
                <div style={{ marginTop: "20px", padding: "12px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #eee", fontSize: "12px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#444" }}>Quick Demo Accounts:</div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                            type="button"
                            onClick={() => fillDemoUser("customer")}
                            style={{ margin: 0, padding: "5px 12px", fontSize: "12px", background: "#e8f4fd", color: "#004085", border: "1px solid #b6e0fe" }}
                        >
                            Demo Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemoUser("admin")}
                            style={{ margin: 0, padding: "5px 12px", fontSize: "12px", background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2" }}
                        >
                            Demo Admin
                        </button>
                    </div>
                </div>

                <Link to="/" style={{ display: "block", marginTop: "15px", color: "#555", fontSize: "13px" }}>
                    ← Return to Fashionista Store
                </Link>
            </div>
        </div>
    );
}

export default Login;
