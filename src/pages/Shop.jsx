import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync state if URL searchParams change
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  // Load distinct categories from backend
  useEffect(() => {
    async function fetchCats() {
      const data = await getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    }
    fetchCats();
  }, []);

  // Fetch products with backend filters
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const params = {};
      if (selectedCategory && selectedCategory !== "All") params.category = selectedCategory;
      if (search && search.trim() !== "") params.search = search.trim();
      if (minPrice !== "") params.minPrice = minPrice;
      if (maxPrice !== "") params.maxPrice = maxPrice;
      if (sort) params.sort = sort;

      const data = await getProducts(params);
      let list = Array.isArray(data) ? data : [];
      if (inStockOnly) {
        list = list.filter((p) => p.stock > 0);
      }
      setProducts(list);
      setLoading(false);
    }
    loadProducts();
  }, [selectedCategory, search, minPrice, maxPrice, sort, inStockOnly]);

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setInStockOnly(false);
    setSearchParams({});
  };

  return (
    <div id="wrapper">
      <Navbar onSearch={(query) => setSearch(query)} />

      <div style={{ background: "#222", color: "white", padding: "30px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px" }}>Explore Fashion Collections</h1>
        <p style={{ color: "#ccc", marginTop: "8px", fontSize: "14px" }}>
          Full product catalogue powered by MySQL 8.0 relational tables with live stock availability
        </p>
      </div>

      <div className="shop-layout">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar">
          <h3>Filters & Refinements</h3>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSearchParams({ category: e.target.value, search });
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search Name / Keyword</label>
            <input
              type="text"
              placeholder="e.g. Cotton, Jeans, Jacket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Price Range (₹ INR)</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="instock"
              style={{ width: "auto" }}
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            <label htmlFor="instock" style={{ margin: 0, cursor: "pointer" }}>In Stock Only</label>
          </div>

          <button onClick={handleResetFilters} className="btn-secondary" style={{ width: "100%", marginTop: "10px" }}>
            Reset Filters
          </button>
        </aside>

        {/* Main Content */}
        <main className="shop-main">
          <div className="shop-controls">
            <div style={{ fontSize: "14px", color: "#555" }}>
              Showing <strong>{products.length}</strong> fashion items
              {selectedCategory !== "All" && ` in "${selectedCategory}"`}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>Sort By:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Product Name (A-Z)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <h3 style={{ textAlign: "center", padding: "50px", color: "#666" }}>
              Fetching matching inventory from MySQL...
            </h3>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", background: "white", padding: "60px 20px", borderRadius: "10px" }}>
              <h3>No products match your selected filters.</h3>
              <p style={{ color: "#777", marginTop: "10px", fontSize: "14px" }}>
                Try adjusting your price range, clearing your search, or selecting another category.
              </p>
              <button onClick={handleResetFilters} className="btn-primary" style={{ marginTop: "20px" }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "flex-start" }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default Shop;
