import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { updateMe } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Profile() {
  const { user, isAuthenticated, loading: authLoading, setUser, logout } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/profile");
    }
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setIsSaving(true);
    try {
      const res = await updateMe({ name, phone, address });
      if (res.user) {
        setUser(res.user);
        setStatusMsg("Profile and shipping details updated in MySQL database!");
      }
    } catch (err) {
      setStatusMsg("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "100px" }}>Loading customer profile...</h2>
        <Footer />
      </div>
    );
  }

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ background: "white", padding: "35px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "24px" }}>Customer Profile</h1>
              <div style={{ fontSize: "13px", color: "#666" }}>Manage your account and shipping details</div>
            </div>
            <span className="badge" style={{ background: user?.role === "admin" ? "#222" : "#3498db", color: "white", padding: "6px 12px" }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>

          {statusMsg && (
            <div className={`alert-box ${statusMsg.includes("failed") ? "alert-error" : "alert-success"}`}>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address (Unique Primary Identification)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{ background: "#f5f5f5", color: "#777" }}
              />
              <span style={{ fontSize: "11px", color: "#888" }}>* Email address is permanently bound to your customer records.</span>
            </div>

            <div className="form-group">
              <label>Contact Phone Number</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Default Shipping Address</label>
              <textarea
                rows="3"
                placeholder="Street address, City, State, PIN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ width: "100%", padding: "12px", fontSize: "15px", marginTop: "10px" }}
            >
              {isSaving ? "Saving to Database..." : "Save Profile Changes"}
            </button>
          </form>

          <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <Link to="/orders">
              <button className="btn-secondary">View Order History</button>
            </Link>
            <button onClick={logout} className="btn-danger">Sign Out</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Profile;
