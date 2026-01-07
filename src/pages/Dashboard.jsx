import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Box, Truck, CheckCircle } from "lucide-react";
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
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-500">Sistema de Validación QR</p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/import"
          className="group border border-neutral-200 p-6 hover:border-neutral-900 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="h-5 w-5 text-neutral-900" />
            <span className="text-xs text-neutral-500">01</span>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 mb-1">
            Importar
          </h2>
          <p className="text-sm text-neutral-500">
            SKUs, Códigos QR y Purchase Orders
          </p>
        </Link>

        <Link
          to="/production"
          className="group border border-neutral-200 p-6 hover:border-neutral-900 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <Box className="h-5 w-5 text-neutral-900" />
            <span className="text-xs text-neutral-500">02</span>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 mb-1">
            Producción
          </h2>
          <p className="text-sm text-neutral-500">Empacar cajas con pares</p>
          {stats.cajas && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-baseline">
                <span className="text-2xl font-medium text-neutral-900">
                  {stats.cajas.empacando || 0}
                </span>
                <span className="ml-2 text-xs text-neutral-500">
                  en proceso
                </span>
              </div>
            </div>
          )}
        </Link>

        <Link
          to="/shipping"
          className="group border border-neutral-200 p-6 hover:border-neutral-900 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <Truck className="h-5 w-5 text-neutral-900" />
            <span className="text-xs text-neutral-500">03</span>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 mb-1">
            Embarque
          </h2>
          <p className="text-sm text-neutral-500">
            Asignar cajas y enviar a T4
          </p>
          {stats.cartones && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-baseline">
                <span className="text-2xl font-medium text-neutral-900">
                  {stats.cartones.en_proceso || 0}
                </span>
                <span className="ml-2 text-xs text-neutral-500">
                  pendientes
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-neutral-500 mb-1">Cajas Empacadas</p>
          <p className="text-2xl font-medium text-neutral-900">
            {stats.cajas?.empacadas || 0}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs text-neutral-500 mb-1">Cajas Asignadas</p>
          <p className="text-2xl font-medium text-neutral-900">
            {stats.cajas?.asignadas || 0}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs text-neutral-500 mb-1">Cartones Completos</p>
          <p className="text-2xl font-medium text-neutral-900">
            {stats.cartones?.completos || 0}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs text-neutral-500 mb-1">QR Disponibles</p>
          <p className="text-2xl font-medium text-neutral-900">
            {stats.qrCodes?.disponibles || 0}
          </p>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="border border-neutral-200">
        <div className="border-b border-neutral-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-neutral-900">
              Purchase Orders
            </h2>
            <button onClick={loadDashboardData} className="btn-ghost text-xs">
              Actualizar
            </button>
          </div>
        </div>

        {stats.pos && stats.pos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {stats.pos.slice(0, 10).map((po) => {
                  const progreso = Math.round(
                    ((po.cartones_completos || 0) /
                      (po.cartones_totales || po.cantidad_cartones || 1)) *
                      100
                  );

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-900">
                          {po.po_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            po.estado === "completada" ||
                            po.estado === "completo"
                              ? "badge-success"
                              : po.estado === "en_proceso"
                              ? "badge-warning"
                              : "badge-neutral"
                          }`}
                        >
                          {po.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-neutral-200 h-1.5">
                            <div
                              className={`h-1.5 transition-all ${
                                progreso === 100
                                  ? "bg-neutral-900"
                                  : "bg-neutral-700"
                              }`}
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-neutral-700 w-10 text-right">
                            {progreso}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(po.estado === "importada" ||
                          po.estado === "en_proceso") && (
                          <Link
                            to={`/shipping?po=${po.po_number}`}
                            className="text-xs font-medium text-neutral-900 hover:underline"
                          >
                            Embarque →
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
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border border-neutral-200 flex items-center justify-center">
              <Package className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              No hay Purchase Orders
            </p>
            <Link to="/import" className="btn-primary text-xs">
              Importar Primera PO
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
