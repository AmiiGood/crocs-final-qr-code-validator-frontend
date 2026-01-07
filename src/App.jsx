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
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#171717",
            fontSize: "14px",
            fontWeight: "500",
            padding: "12px 16px",
            border: "1px solid #e5e5e5",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
          success: {
            iconTheme: {
              primary: "#171717",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#171717",
              secondary: "#fff",
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
