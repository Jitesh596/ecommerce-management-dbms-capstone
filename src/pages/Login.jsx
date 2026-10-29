import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill all fields");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        alert("Login Successful!");
        navigate("/");
    };

    return (
        <div id="loginPage">
            <div id="loginBox">
                <h1>Login</h1>

                {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">Login</button>
                </form>

                <Link to="/" style={{ display: "block", marginTop: "15px", color: "#555" }}>
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}

export default Login;