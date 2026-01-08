import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Box, Truck, Send, Sparkles } from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, color: "text-primary-600" },
    { name: "Importar", href: "/import", icon: Upload, color: "text-info-600" },
    {
      name: "Producción",
      href: "/production",
      icon: Box,
      color: "text-success-600",
    },
    {
      name: "Embarque",
      href: "/shipping",
      icon: Truck,
      color: "text-warning-600",
    },
    { name: "Enviar", href: "/pos", icon: Send, color: "text-danger-600" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header con gradiente */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 border-b border-primary-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110 duration-200">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-white">
                  Validación QR
                </span>
                <p className="text-xs text-primary-100">Foam Creations</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-xs text-primary-100">Sistema v2.0</p>
                <p className="text-xs text-primary-200">En línea</p>
              </div>
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse-soft"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation con colores */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 rounded-t-lg group ${
                    active
                      ? "text-primary-700 border-primary-600 bg-primary-50/50"
                      : "text-neutral-600 border-transparent hover:text-primary-600 hover:bg-primary-50/30"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 mr-2 transition-colors ${
                      active
                        ? item.color
                        : "text-neutral-400 group-hover:" + item.color
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

      {/* Footer con gradiente */}
      <footer className="bg-gradient-to-r from-neutral-50 to-blue-50 border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-neutral-600">
              Foam Creations © 2026 · Sistema de Validación QR v2.0
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Powered by</span>
              <span className="font-semibold text-gradient">React + Vite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
