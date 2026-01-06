import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Box,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl font-black text-gray-900 mb-3">
            📊 Dashboard
          </h1>
          <p className="text-2xl text-gray-600">
            Sistema de Validación QR - Foam Creations
          </p>
        </div>

        {/* Acciones Principales - GRANDES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Importar */}
          <Link
            to="/import"
            className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl p-8 shadow-2xl transition-all transform hover:scale-105 border-4 border-blue-300"
          >
            <div className="text-center text-white">
              <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black mb-3">Importar</h2>
              <p className="text-xl opacity-90">
                SKUs, Códigos QR y Purchase Orders
              </p>
            </div>
          </Link>

          {/* Producción */}
          <Link
            to="/production"
            className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-3xl p-8 shadow-2xl transition-all transform hover:scale-105 border-4 border-green-300"
          >
            <div className="text-center text-white">
              <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Box className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black mb-3">Producción</h2>
              <p className="text-xl opacity-90">Empacar cajas con pares</p>
              {stats.cajas && (
                <div className="mt-4 bg-white/20 rounded-xl py-3 px-4">
                  <p className="text-4xl font-black">
                    {stats.cajas.empacando || 0}
                  </p>
                  <p className="text-sm opacity-90">cajas en proceso</p>
                </div>
              )}
            </div>
          </Link>

          {/* Embarque */}
          <Link
            to="/shipping"
            className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-3xl p-8 shadow-2xl transition-all transform hover:scale-105 border-4 border-purple-300"
          >
            <div className="text-center text-white">
              <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black mb-3">Embarque</h2>
              <p className="text-xl opacity-90">Asignar cajas y enviar a T4</p>
              {stats.cartones && (
                <div className="mt-4 bg-white/20 rounded-xl py-3 px-4">
                  <p className="text-4xl font-black">
                    {stats.cartones.en_proceso || 0}
                  </p>
                  <p className="text-sm opacity-90">cartones pendientes</p>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">
                Cajas Empacadas
              </span>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">
              {stats.cajas?.empacadas || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">listas para embarque</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">
                Cajas Asignadas
              </span>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">
              {stats.cajas?.asignadas || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">en cartones</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">
                Cartones Completos
              </span>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">
              {stats.cartones?.completos || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">listos para enviar</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-semibold">
                QR Disponibles
              </span>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-4xl font-black text-gray-900">
              {stats.qrCodes?.disponibles || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">sin escanear</p>
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-gray-900">
              📋 Purchase Orders
            </h2>
            <button
              onClick={loadDashboardData}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>

          {stats.pos && stats.pos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-700 uppercase">
                      PO Number
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-700 uppercase">
                      Progreso
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-700 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.pos.slice(0, 10).map((po) => {
                    const progreso = Math.round(
                      ((po.cartones_completos || 0) /
                        (po.cartones_totales || po.cantidad_cartones || 1)) *
                        100
                    );

                    return (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-900">
                            {po.po_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${
                              po.estado === "completada" ||
                              po.estado === "completo"
                                ? "bg-green-100 text-green-800"
                                : po.estado === "en_proceso"
                                ? "bg-yellow-100 text-yellow-800"
                                : po.estado === "enviada"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {po.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  progreso === 100
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${progreso}%` }}
                              ></div>
                            </div>
                            <span className="text-lg font-bold text-gray-700 w-16">
                              {progreso}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {po.cartones_completos || 0} /{" "}
                            {po.cartones_totales || po.cantidad_cartones}{" "}
                            cartones
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(po.estado === "importada" ||
                            po.estado === "en_proceso") && (
                            <Link
                              to={`/shipping?po=${po.po_number}`}
                              className="inline-flex items-center px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
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
            <div className="text-center py-16">
              <AlertCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-4">
                No hay Purchase Orders
              </p>
              <Link
                to="/import"
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-colors"
              >
                Importar Primera PO
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
