import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Box, Truck, Package } from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      color: "from-gray-500 to-gray-600",
    },
    {
      name: "Importar",
      href: "/import",
      icon: Upload,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Producción",
      href: "/production",
      icon: Box,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Embarque",
      href: "/shipping",
      icon: Truck,
      color: "from-purple-500 to-purple-600",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con Gradiente */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-all">
                <Package className="h-10 w-10 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black text-white">
                  Sistema de Validación QR
                </span>
                <p className="text-sm text-white/80 font-medium">
                  Foam Creations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Navegación Principal */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 rounded-xl font-bold text-lg transition-all transform ${
                    active
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-110`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  <Icon className="h-6 w-6 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-12">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm">
            © 2026 Foam Creations - Sistema de Validación QR v2.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
