import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  QrCode,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Upload,
  ScanLine,
  Send,
} from "lucide-react";
import { cartonService, qrService, poService } from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    cartones: null,
    qrCodes: null,
    pos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [cartonesRes, qrRes, posRes] = await Promise.all([
        cartonService.getStatistics(),
        qrService.getStatistics(),
        poService.getAllPurchaseOrders(),
      ]);

      setStats({
        cartones: cartonesRes.data.data,
        qrCodes: qrRes.data.data,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <div className="card hover:shadow-lg transition-shadow cursor-pointer">
      <Link to={link || "#"}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
          <div
            className={`p-3 rounded-full ${color
              .replace("text", "bg")
              .replace("600", "100")}`}
          >
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button onClick={loadDashboardData} className="btn-secondary">
          Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cartones"
          value={stats.cartones?.total_cartones || "0"}
          icon={Package}
          color="text-blue-600"
          link="/scan"
        />
        <StatCard
          title="Cartones Completos"
          value={stats.cartones?.completos || "0"}
          icon={CheckCircle}
          color="text-green-600"
          link="/send"
        />
        <StatCard
          title="En Proceso"
          value={stats.cartones?.en_proceso || "0"}
          icon={Clock}
          color="text-yellow-600"
          link="/scan"
        />
        <StatCard
          title="Códigos QR Disponibles"
          value={stats.qrCodes?.disponibles || "0"}
          icon={QrCode}
          color="text-purple-600"
          link="/import"
        />
      </div>

      {/* Recent POs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Purchase Orders Recientes
          </h2>
          <Link
            to="/import"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Importar nueva PO →
          </Link>
        </div>

        {stats.pos && stats.pos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cartones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.pos.slice(0, 5).map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {po.po_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          po.estado === "completo" || po.estado === "completada"
                            ? "badge-success"
                            : po.estado === "en_proceso"
                            ? "badge-warning"
                            : po.estado === "enviada"
                            ? "badge-info"
                            : "badge-danger"
                        }`}
                      >
                        {po.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {po.cartones_completos || 0} /{" "}
                      {po.cartones_totales || po.cantidad_cartones}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${
                                ((po.cartones_completos || 0) /
                                  (po.cartones_totales ||
                                    po.cantidad_cartones ||
                                    1)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round(
                            ((po.cartones_completos || 0) /
                              (po.cartones_totales ||
                                po.cantidad_cartones ||
                                1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {po.estado === "importada" ||
                      po.estado === "en_proceso" ? (
                        <Link
                          to={`/scan?po=${po.po_number}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Escanear →
                        </Link>
                      ) : po.estado === "completada" ? (
                        <Link
                          to={`/send?po=${po.po_number}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Enviar →
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay Purchase Orders importadas</p>
            <Link to="/import" className="btn-primary mt-4 inline-block">
              Importar Primera PO
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/import" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Importar Datos</h3>
              <p className="text-sm text-gray-500">SKUs, QR Codes o POs</p>
            </div>
          </div>
        </Link>

        <Link to="/scan" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <ScanLine className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Escanear Cartones</h3>
              <p className="text-sm text-gray-500">Validar códigos QR</p>
            </div>
          </div>
        </Link>

        <Link to="/send" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Send className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enviar a T4</h3>
              <p className="text-sm text-gray-500">POs completadas</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
