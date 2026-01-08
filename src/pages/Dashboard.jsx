import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Box, Truck, Sparkles, TrendingUp } from "lucide-react";
import {
  cartonService,
  qrService,
  poService,
  cajaService,
} from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    cartones: null,
    qrCodes: null,
    cajas: null,
    pos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [cartonesRes, qrRes, cajasRes, posRes] = await Promise.all([
        cartonService.getStatistics(),
        qrService.getStatistics(),
        cajaService.getStatistics(),
        poService.getAllPurchaseOrders(),
      ]);

      setStats({
        cartones: cartonesRes.data.data,
        qrCodes: qrRes.data.data,
        cajas: cajasRes.data.data,
        pos: posRes.data.data,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-neutral-600">
          Bienvenido al Sistema de Validación QR
        </p>
      </div>

      {/* Main Actions con gradientes y colores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/import"
          className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-info-500 to-info-600 opacity-90"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                01
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Importar</h2>
            <p className="text-info-100">SKUs, Códigos QR y Purchase Orders</p>
          </div>
        </Link>

        <Link
          to="/production"
          className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-success-500 to-success-600 opacity-90"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Box className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                02
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Producción</h2>
            <p className="text-success-100">Empacar cajas con pares</p>
            {stats.cajas && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">
                    {stats.cajas.empacando || 0}
                  </span>
                  <span className="ml-2 text-sm text-success-100">
                    en proceso
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>

        <Link
          to="/shipping"
          className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warning-500 to-warning-600 opacity-90"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Truck className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                03
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Embarque</h2>
            <p className="text-warning-100">Asignar cajas y enviar</p>
            {stats.cartones && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">
                    {stats.cartones.en_proceso || 0}
                  </span>
                  <span className="ml-2 text-sm text-warning-100">
                    pendientes
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Statistics con colores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Cajas Empacadas
            </p>
            <Box className="h-5 w-5 text-success-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-gradient">
            {stats.cajas?.empacadas || 0}
          </p>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Cajas Asignadas
            </p>
            <Truck className="h-5 w-5 text-warning-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-gradient">
            {stats.cajas?.asignadas || 0}
          </p>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Cartones Completos
            </p>
            <Package className="h-5 w-5 text-primary-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-gradient">
            {stats.cartones?.completos || 0}
          </p>
        </div>

        <div className="stat-card group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              QR Disponibles
            </p>
            <Sparkles className="h-5 w-5 text-info-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-gradient">
            {stats.qrCodes?.disponibles || 0}
          </p>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              Purchase Orders
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Estado de las órdenes de producción
            </p>
          </div>
          <button onClick={loadDashboardData} className="btn-secondary text-xs">
            Actualizar
          </button>
        </div>

        {stats.pos && stats.pos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary-50 to-blue-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats.pos.slice(0, 10).map((po) => {
                  const progreso = Math.round(
                    ((po.cartones_completos || 0) /
                      (po.cartones_totales || po.cantidad_cartones || 1)) *
                      100
                  );

                  const getEstadoBadge = (estado) => {
                    const badges = {
                      importada: { class: "badge-primary", label: "Importada" },
                      en_proceso: {
                        class: "badge-warning",
                        label: "En Proceso",
                      },
                      completada: {
                        class: "badge-success",
                        label: "Completada",
                      },
                      completada: {
                        class: "badge-success",
                        label: "Completada",
                      },
                      enviada: { class: "badge-info", label: "Enviada" },
                      cancelada: { class: "badge-danger", label: "Cancelada" },
                    };
                    const badge = badges[estado] || {
                      class: "badge-neutral",
                      label: estado,
                    };
                    return (
                      <span className={`badge ${badge.class}`}>
                        {badge.label}
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-neutral-900">
                          {po.po_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(po.estado)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 progress-bar max-w-[200px]">
                            <div
                              className={`progress-bar-fill ${
                                progreso === 100
                                  ? "progress-bar-fill-success"
                                  : ""
                              }`}
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-primary-600 w-12 text-right">
                            {progreso}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(po.estado === "importada" ||
                          po.estado === "en_proceso") && (
                          <Link
                            to={`/shipping?po=${po.po_number}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                          >
                            Embarque
                            <span>→</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl bg-gradient-to-br from-neutral-50 to-blue-50 border-2 border-dashed border-neutral-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Package className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-neutral-600 mb-4 font-medium">
              No hay Purchase Orders
            </p>
            <Link to="/import" className="btn-primary">
              Importar Primera PO
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
