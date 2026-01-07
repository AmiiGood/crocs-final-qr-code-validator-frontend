import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Box, Truck } from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Importar", href: "/import", icon: Upload },
    { name: "Producción", href: "/production", icon: Box },
    { name: "Embarque", href: "/shipping", icon: Truck },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium text-neutral-900">
                  Validación QR
                </span>
                <p className="text-xs text-neutral-500">Foam Creations</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    active
                      ? "text-neutral-900 border-neutral-900"
                      : "text-neutral-500 border-transparent hover:text-neutral-700"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-xs text-neutral-500 text-center">
            Foam Creations © 2026 · Sistema de Validación QR v2.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
