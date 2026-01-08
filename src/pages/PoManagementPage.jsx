import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  Send,
  XCircle,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Box,
  Loader,
} from "lucide-react";
import { poService, trysorService } from "../services/api";
import toast from "react-hot-toast";

const PoManagementPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [selectedPo, setSelectedPo] = useState(searchParams.get("po") || null);
  const [poDetails, setPoDetails] = useState(null);
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    loadPos();
  }, []);

  useEffect(() => {
    if (selectedPo) {
      loadPoDetails();
      validatePo();
    }
  }, [selectedPo]);

  const loadPos = async () => {
    setLoading(true);
    try {
      const response = await poService.getAllPurchaseOrders();
      setPos(response.data.data);
    } catch (error) {
      toast.error("Error al cargar POs");
    } finally {
      setLoading(false);
    }
  };

  const loadPoDetails = async () => {
    try {
      const response = await poService.getPoByNumber(selectedPo);
      setPoDetails(response.data.data);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
    }
  };

  const validatePo = async () => {
    try {
      const response = await trysorService.validatePo(selectedPo);
      setValidation(response.data);
    } catch (error) {
      setValidation(error.response?.data);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await trysorService.getPreview(selectedPo);
      setPreview(response.data.data);
      toast.success("Vista previa generada");
    } catch (error) {
      toast.error("Error al generar vista previa");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!window.confirm(`¿Enviar PO ${selectedPo} a Trysor/T4?`)) return;

    setSending(true);
    try {
      const response = await trysorService.sendPo(selectedPo);
      if (response.data.success) {
        toast.success("PO enviada exitosamente a T4");
        setSelectedPo(null);
        setPoDetails(null);
        setValidation(null);
        setPreview(null);
        loadPos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al enviar PO");
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`¿Cancelar PO ${selectedPo} en T4?`)) return;

    setSending(true);
    try {
      const response = await trysorService.cancelPo(selectedPo);
      if (response.data.success) {
        toast.success("PO cancelada exitosamente");
        setSelectedPo(null);
        setPoDetails(null);
        setValidation(null);
        setPreview(null);
        loadPos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cancelar PO");
    } finally {
      setSending(false);
    }
  };

  const getFilteredPos = () => {
    switch (filter) {
      case "active":
        return pos.filter(
          (po) =>
            po.estado === "importada" ||
            po.estado === "en_proceso" ||
            po.estado === "completada"
        );
      case "completed":
        return pos.filter(
          (po) => po.estado === "enviada" || po.estado === "completada"
        );
      default:
        return pos;
    }
  };

  const filteredPos = getFilteredPos();

  const getEstadoBadge = (estado) => {
    const badges = {
      importada: { color: "bg-blue-100 text-blue-700", label: "Importada" },
      en_proceso: {
        color: "bg-yellow-100 text-yellow-700",
        label: "En Proceso",
      },
      completada: {
        color: "bg-green-100 text-green-700",
        label: "Completada",
      },
      enviada: { color: "bg-neutral-900 text-white", label: "Enviada" },
      cancelada: { color: "bg-red-100 text-red-700", label: "Cancelada" },
    };

    const badge = badges[estado] || {
      color: "bg-neutral-200 text-neutral-700",
      label: estado,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Gestión de Purchase Orders
        </h1>
        <p className="text-sm text-neutral-500">
          Monitorea el progreso y envía las POs a Trysor/T4
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900"
          }`}
        >
          Todas ({pos.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900"
          }`}
        >
          Activas (
          {
            pos.filter(
              (po) =>
                po.estado === "importada" ||
                po.estado === "en_proceso" ||
                po.estado === "completada"
            ).length
          }
          )
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "completed"
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900"
          }`}
        >
          Enviadas (
          {
            pos.filter(
              (po) => po.estado === "enviada" || po.estado === "completada"
            ).length
          }
          )
        </button>
        <div className="ml-auto">
          <button onClick={loadPos} className="btn-ghost text-xs">
            Actualizar
          </button>
        </div>
      </div>

      {/* Lista de POs */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-6 w-6 animate-spin text-neutral-900" />
        </div>
      ) : filteredPos.length > 0 ? (
        <div className="border border-neutral-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Cartones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Pares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredPos.map((po) => {
                const progreso = Math.round(
                  ((po.cartones_completos || 0) /
                    (po.cartones_totales || po.cantidad_cartones || 1)) *
                    100
                );

                return (
                  <tr
                    key={po.id}
                    className={`hover:bg-neutral-50 transition-colors cursor-pointer ${
                      selectedPo === po.po_number ? "bg-neutral-100" : ""
                    }`}
                    onClick={() => setSelectedPo(po.po_number)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-neutral-400 mr-2" />
                        <span className="text-sm font-medium text-neutral-900">
                          {po.po_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(po.estado)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-neutral-200 h-1.5 max-w-[120px]">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {po.cartones_completos || 0}/
                      {po.cartones_totales || po.cantidad_cartones}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {po.pares_escaneados || 0}/{po.cantidad_pares}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPo(po.po_number);
                        }}
                        className="text-neutral-900 hover:underline font-medium"
                      >
                        Ver detalles →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-neutral-200 p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <p className="text-sm text-neutral-500 mb-4">
            No hay Purchase Orders {filter !== "all" && "en esta categoría"}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="btn-secondary text-xs"
            >
              Ver Todas
            </button>
          )}
        </div>
      )}

      {/* Panel de Detalles */}
      {selectedPo && poDetails && (
        <div className="border border-neutral-200 p-6 animate-fade-in">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {selectedPo}
                </h2>
                {getEstadoBadge(poDetails.estado)}
              </div>
              <p className="text-sm text-neutral-500">
                Creada el {new Date(poDetails.created_at).toLocaleDateString()}{" "}
                - CFM XF Date:{" "}
                {new Date(poDetails.cfm_xf_date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPo(null);
                setPoDetails(null);
                setValidation(null);
                setPreview(null);
              }}
              className="btn-ghost text-xs"
            >
              Cerrar
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">Cartones</span>
                <Box className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-medium text-neutral-900">
                {poDetails.cantidad_cartones}
              </p>
              <p className="text-xs text-neutral-500">Total requeridos</p>
            </div>

            <div className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">Pares</span>
                <Package className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-medium text-neutral-900">
                {poDetails.cantidad_pares}
              </p>
              <p className="text-xs text-neutral-500">Total esperados</p>
            </div>

            <div className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500">Progreso</span>
                <TrendingUp className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-medium text-neutral-900">
                {Math.round(
                  ((poDetails.cartones_completos || 0) /
                    (poDetails.cantidad_cartones || 1)) *
                    100
                )}
                %
              </p>
              <p className="text-xs text-neutral-500">Completado</p>
            </div>
          </div>

          {/* Validación */}
          {validation && (
            <div
              className={`border-2 p-6 mb-6 ${
                validation.success
                  ? "border-green-200 bg-green-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                {validation.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {validation.success
                      ? "✅ PO Lista para Enviar"
                      : "⚠️ PO No Lista"}
                  </h3>
                  <p className="text-sm text-neutral-700 mb-4">
                    {validation.message}
                  </p>

                  {validation.success && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handlePreview}
                        disabled={loading}
                        className="btn-secondary text-xs"
                      >
                        <Eye className="h-4 w-4 inline mr-2" />
                        {loading ? "Cargando..." : "Vista Previa"}
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="btn-primary text-xs"
                      >
                        <Send className="h-4 w-4 inline mr-2" />
                        {sending ? "Enviando..." : "Enviar a T4"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={sending}
                        className="px-4 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4 inline mr-2" />
                        Cancelar
                      </button>
                    </div>
                  )}

                  {!validation.success && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/shipping?po=${selectedPo}`)}
                        className="btn-primary text-xs"
                      >
                        Ir a Embarque →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vista Previa */}
          {preview && (
            <div className="border border-neutral-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-neutral-900">
                  Vista Previa de Datos para T4
                </h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs text-neutral-500 hover:text-neutral-900"
                >
                  Ocultar
                </button>
              </div>
              <div className="bg-neutral-50 p-4 overflow-auto max-h-96">
                <pre className="text-xs font-mono text-neutral-700">
                  {JSON.stringify(preview.trysorData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoManagementPage;
