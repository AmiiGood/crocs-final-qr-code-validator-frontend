import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ImportPage from "./pages/ImportPage";
import ProductionPage from "./pages/ProductionPage";
import ShippingPage from "./pages/ShippingPage";
import PoManagementPage from "./pages/PoManagementPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/pos" element={<PoManagementPage />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#171717",
            fontSize: "14px",
            fontWeight: "500",
            padding: "14px 18px",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(37, 99, 235, 0.15)",
          },
          success: {
            style: {
              background: "linear-gradient(to right, #dcfce7, #bbf7d0)",
              color: "#166534",
              border: "2px solid #86efac",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#fff",
            },
          },
          error: {
            style: {
              background: "linear-gradient(to right, #fee2e2, #fecaca)",
              color: "#991b1b",
              border: "2px solid #fca5a5",
            },
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fff",
            },
          },
          loading: {
            style: {
              background: "linear-gradient(to right, #dbeafe, #bfdbfe)",
              color: "#1e40af",
              border: "2px solid #93c5fd",
            },
            iconTheme: {
              primary: "#2563eb",
              secondary: "#fff",
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
