import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { updateProfileApi } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Profile() {
    const { user, isAuthenticated, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Profile form state
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Messages state
    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login?redirect=/profile");
        }
    }, [isAuthenticated]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError("");
        setProfileSuccess("");
        setSaving(true);

        try {
            const res = await updateProfileApi({
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim()
            });
            updateUser(res.user);
            setProfileSuccess("✓ Personal details updated successfully!");
        } catch (err) {
            setProfileError(err.response?.data?.error || "Could not update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword || !newPassword) {
            setPasswordError("Please fill both password fields.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            await updateProfileApi({
                currentPassword,
                newPassword
            });
            setPasswordSuccess("✓ Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setPasswordError(err.response?.data?.error || "Could not change password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "0 20px", minHeight: "70vh" }}>
                <Link to="/" style={{ textDecoration: "none" }}>
                    <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                        ← Back to Shopping
                    </button>
                </Link>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h1 style={{ margin: 0 }}>My Account Profile</h1>
                        <p style={{ color: "#777", marginTop: "4px" }}>Manage your personal details, shipping address and security settings</p>
                    </div>

                    <button
                        onClick={logout}
                        style={{ padding: "10px 22px", border: "1px solid #c62828", borderRadius: "20px", background: "white", color: "#c62828", fontWeight: "bold", cursor: "pointer" }}
                    >
                        🚪 Sign Out
                    </button>
                </div>

                {/* Quick Shortcuts Bar */}
                <div style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }}>
                    <Link to="/orders" style={{ textDecoration: "none" }}>
                        <button style={{ padding: "12px 24px", borderRadius: "20px", border: "1px solid #ccc", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                            📦 View Order History & Tracking
                        </button>
                    </Link>

                    <Link to="/wishlist" style={{ textDecoration: "none" }}>
                        <button style={{ padding: "12px 24px", borderRadius: "20px", border: "1px solid #ccc", background: "white", color: "#333", fontWeight: "bold", cursor: "pointer" }}>
                            ❤️ Saved Wishlist
                        </button>
                    </Link>

                    <Link to="/cart" style={{ textDecoration: "none" }}>
                        <button style={{ padding: "12px 24px", borderRadius: "20px", border: "1px solid #ccc", background: "white", color: "#333", fontWeight: "bold", cursor: "pointer" }}>
                            🛒 Shopping Bag
                        </button>
                    </Link>

                    {user?.role === "admin" && (
                        <Link to="/admin" style={{ textDecoration: "none" }}>
                            <button style={{ padding: "12px 24px", borderRadius: "20px", border: "none", background: "#e74c3c", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                                ⚙️ Admin Dashboard
                            </button>
                        </Link>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }} className="cart-grid">
                    {/* Left: Update Profile Details */}
                    <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            Personal Information
                        </h2>

                        {profileSuccess && (
                            <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
                                {profileSuccess}
                            </div>
                        )}
                        {profileError && (
                            <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
                                {profileError}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile}>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Email Address (Account ID)</label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    readOnly
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: "6px", color: "#666" }}
                                />
                                <span style={{ fontSize: "11px", color: "#888" }}>Email cannot be altered.</span>
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +91 9876543210"
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Saved Delivery Address</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={3}
                                    placeholder="Enter your default home or office shipping address"
                                    style={{ width: "100%", padding: "10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{ padding: "12px 28px", border: "none", borderRadius: "20px", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>

                    {/* Right: Change Password */}
                    <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            Change Password
                        </h2>

                        {passwordSuccess && (
                            <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
                                {passwordSuccess}
                            </div>
                        )}
                        {passwordError && (
                            <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword}>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#555" }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{ padding: "12px 28px", border: "none", borderRadius: "20px", background: "#333", color: "white", fontWeight: "bold", cursor: "pointer" }}
                            >
                                {saving ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Profile;
