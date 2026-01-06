import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ImportPage from "./pages/ImportPage";
import ProductionPage from "./pages/ProductionPage";
import ShippingPage from "./pages/ShippingPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#fff",
            color: "#1f2937",
            fontSize: "18px",
            fontWeight: "600",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
            style: {
              border: "3px solid #10b981",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
            style: {
              border: "3px solid #ef4444",
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
