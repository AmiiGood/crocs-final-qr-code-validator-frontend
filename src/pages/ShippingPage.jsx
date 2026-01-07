import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, Search } from "lucide-react";
import {
  embarqueService,
  cartonService,
  poService,
  trysorService,
} from "../services/api";
import toast from "react-hot-toast";

const ShippingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [selectedPo, setSelectedPo] = useState(searchParams.get("po") || "");
  const [poData, setPoData] = useState(null);
  const [cartones, setCartones] = useState(null);
  const [cartonActual, setCartonActual] = useState(null);
  const [cartonDetails, setCartonDetails] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    loadPos();
  }, []);

  useEffect(() => {
    if (selectedPo) {
      loadCartones();
    }
  }, [selectedPo]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [cartonActual]);

  const cleanCode = (raw) => {
    if (!raw) return "";
    let cleaned = raw.trim().toUpperCase();

    if (
      cleaned.includes("verify.crocs.com") ||
      cleaned.includes("VERIFY.CROCS.COM")
    ) {
      const parts = cleaned.split(/[\/]/);
      cleaned = parts[parts.length - 1];
    }

    cleaned = cleaned.replace(/^Q[-\/]/i, "");

    if (cleaned.includes("$")) {
      return cleaned.replace(/[^A-Z0-9$\-]/g, "");
    } else {
      return cleaned.replace(/[^A-Z0-9]/g, "");
    }
  };

  const loadPos = async () => {
    try {
      const response = await poService.getAllPurchaseOrders();
      setPos(
        response.data.data.filter(
          (po) =>
            po.estado === "importada" ||
            po.estado === "en_proceso" ||
            po.estado === "completada"
        )
      );
    } catch (error) {
      toast.error("Error al cargar POs");
    }
  };

  const loadCartones = async () => {
    setLoading(true);
    try {
      const [cartonesRes, poRes] = await Promise.all([
        embarqueService.getCartonesPendientes(selectedPo),
        poService.getPoByNumber(selectedPo),
      ]);

      setCartones(cartonesRes.data.data);
      setPoData(poRes.data.data);
    } catch (error) {
      toast.error("Error al cargar cartones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim() || loading) return;

    const cleaned = cleanCode(scanInput);
    if (!cleaned) {
      toast.error("Código inválido");
      setScanInput("");
      return;
    }

    const esCaja = cleaned.includes("$");

    if (!cartonActual) {
      if (esCaja) {
        toast.error("Primero escanea el cartón, no la caja");
        setScanInput("");
        return;
      }
      await seleccionarCarton(cleaned);
    } else {
      if (cartonActual.tipo === "mono_sku") {
        if (!esCaja) {
          toast.error("Escanea el código de la caja (con símbolo $)");
          setScanInput("");
          return;
        }
        await asignarCaja(cleaned);
      } else {
        if (esCaja) {
          toast.error(
            "Los cartones musicales no usan cajas. Escanea el QR del par"
          );
          setScanInput("");
          return;
        }
        await escanearParMusical(cleaned);
      }
    }
  };

  const seleccionarCarton = async (codigo) => {
    let carton = cartones.monoSku.find(
      (c) => c.carton_id.toUpperCase() === codigo
    );
    let tipo = "mono_sku";

    if (!carton) {
      carton = cartones.musical.find(
        (c) => c.carton_id.toUpperCase() === codigo
      );
      tipo = "musical";
    }

    if (!carton) {
      toast.error(`Cartón "${codigo}" no encontrado en esta PO`);
      setScanInput("");
      return;
    }

    if (tipo === "mono_sku" && carton.caja_asignada) {
      toast.success(`Cartón "${codigo}" ya está completo`);
      setScanInput("");
      return;
    }

    if (tipo === "musical") {
      try {
        await cartonService.startScan(carton.id);
        const response = await cartonService.getCartonById(carton.id);
        setCartonDetails(response.data.data);
      } catch (error) {
        toast.error("Error al cargar cartón");
        console.error(error);
        setScanInput("");
        return;
      }
    }

    setCartonActual({ ...carton, tipo });
    setScanInput("");
    toast.success(
      `Cartón seleccionado. ${
        tipo === "mono_sku" ? "Escanea la caja" : "Escanea los pares"
      }`
    );
  };

  const asignarCaja = async (codigoCaja) => {
    try {
      const response = await embarqueService.assignBoxToCarton(
        codigoCaja,
        cartonActual.id
      );

      if (response.data.success) {
        toast.success("Cartón completado");
        setTimeout(() => {
          setCartonActual(null);
          setScanInput("");
          loadCartones();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al asignar caja");
      setScanInput("");
    }
  };

  const escanearParMusical = async (codigo) => {
    try {
      const response = await cartonService.scanQr(cartonActual.id, codigo);
      if (response.data.success) {
        if (response.data.alreadyComplete) {
          toast.success("Este cartón ya está completo");
          setCartonActual(null);
          setCartonDetails(null);
          setScanInput("");
          loadCartones();
          return;
        }

        if (response.data.data.carton.completo) {
          toast.success("Cartón completado");
          setTimeout(() => {
            setCartonActual(null);
            setCartonDetails(null);
            setScanInput("");
            loadCartones();
          }, 1500);
        } else {
          toast.success(
            `${response.data.data.detalle.cantidadEscaneada}/${response.data.data.detalle.cantidadRequerida}`
          );
          const detailsResponse = await cartonService.getCartonById(
            cartonActual.id
          );
          setCartonDetails(detailsResponse.data.data);
          setScanInput("");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al escanear");
      setScanInput("");
    }
  };

  const handleEnviarPo = async () => {
    if (!window.confirm(`¿Enviar PO ${selectedPo} a Trysor/T4?`)) return;

    setSending(true);
    try {
      const response = await trysorService.sendPo(selectedPo);
      if (response.data.success) {
        toast.success("PO enviada exitosamente a T4");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al enviar PO");
    } finally {
      setSending(false);
    }
  };

  const esPoCompleta =
    poData?.estado === "completada" ||
    (cartones &&
      cartones.monoSku.every((c) => c.caja_asignada) &&
      cartones.musical.length === 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Embarque
        </h1>
        <p className="text-sm text-neutral-500">
          Asigna cajas a cartones y completa el embarque
        </p>
      </div>

      {/* Modal de Debug */}
      {showDebug && cartones && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl max-h-[80vh] overflow-auto">
            <div className="border-b border-neutral-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-neutral-900">
                  Cartones Disponibles
                </h2>
                <button
                  onClick={() => setShowDebug(false)}
                  className="btn-ghost text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Mono-SKU ({cartones.monoSku.length})
                </h3>
                <div className="space-y-2">
                  {cartones.monoSku.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 border border-neutral-200 text-sm"
                    >
                      <p className="font-mono font-medium">{c.carton_id}</p>
                      <p className="text-xs text-neutral-500">
                        SKU: {c.sku_number}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Musical ({cartones.musical.length})
                </h3>
                <div className="space-y-2">
                  {cartones.musical.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 border border-neutral-200 text-sm"
                    >
                      <p className="font-mono font-medium">{c.carton_id}</p>
                      <p className="text-xs text-neutral-500">
                        {c.total_skus} SKUs - {c.total_pares_escaneados}/
                        {c.total_pares_requeridos} pares
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de PO */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Purchase Order
            </label>
            <select
              value={selectedPo}
              onChange={(e) => {
                setSelectedPo(e.target.value);
                setCartonActual(null);
                setCartonDetails(null);
                setShowDebug(false);
              }}
              className="input"
              disabled={cartonActual}
            >
              <option value="">Seleccionar PO</option>
              {pos.map((po) => (
                <option key={po.id} value={po.po_number}>
                  {po.po_number} ({po.cartones_completos || 0}/
                  {po.cartones_totales || po.cantidad_cartones})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-6 flex gap-2">
            {selectedPo && cartones && !cartonActual && (
              <button
                onClick={() => setShowDebug(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Ver Cartones
              </button>
            )}

            {selectedPo && esPoCompleta && !cartonActual && (
              <button
                onClick={handleEnviarPo}
                disabled={sending}
                className="btn-primary"
              >
                {sending ? "Enviando..." : "Enviar a T4"}
              </button>
            )}
          </div>
        </div>

        {selectedPo && cartones && !cartonActual && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="text-xs text-neutral-500 mb-1">Mono-SKU</p>
              <p className="text-2xl font-medium text-neutral-900">
                {cartones.monoSku.filter((c) => !c.caja_asignada).length}
              </p>
              <p className="text-xs text-neutral-500">pendientes</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-neutral-500 mb-1">Musical</p>
              <p className="text-2xl font-medium text-neutral-900">
                {cartones.musical.length}
              </p>
              <p className="text-xs text-neutral-500">pendientes</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Principal */}
      {selectedPo && (
        <div className="card max-w-2xl mx-auto">
          {/* Info de Cartón Actual */}
          {cartonActual && (
            <div className="mb-8 pb-8 border-b border-neutral-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">
                    {cartonActual.tipo === "mono_sku" ? "MONO-SKU" : "MUSICAL"}
                  </p>
                  <h2 className="text-xl font-medium text-neutral-900 mb-3">
                    {cartonActual.carton_id}
                  </h2>

                  {/* Info Mono-SKU */}
                  {cartonActual.tipo === "mono_sku" && (
                    <div className="space-y-1 text-sm">
                      <p className="text-neutral-700">
                        <span className="text-neutral-500">SKU:</span>{" "}
                        {cartonActual.sku_number}
                      </p>
                      <p className="text-neutral-700">
                        {cartonActual.style_name}
                      </p>
                      <p className="font-medium text-neutral-900">
                        {cartonActual.cantidad_requerida} pares
                      </p>
                    </div>
                  )}

                  {/* Info Musical */}
                  {cartonActual.tipo === "musical" && cartonDetails && (
                    <div>
                      <p className="text-sm text-neutral-700 mb-4">
                        {cartonDetails.detalles.length} SKUs diferentes
                      </p>

                      {/* Progreso por SKU */}
                      <div className="space-y-2 mb-4">
                        {cartonDetails.detalles.map((detalle) => (
                          <div
                            key={detalle.id}
                            className="border-l-2 border-neutral-900 pl-3 py-2"
                          >
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {detalle.sku_number}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {detalle.style_name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {detalle.cantidad_escaneada}/
                                  {detalle.cantidad_requerida}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Progreso Total */}
                      <div className="border border-neutral-200 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-neutral-700">
                            Total
                          </span>
                          <span className="text-xl font-medium text-neutral-900">
                            {cartonDetails.progreso.porcentaje.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 h-2">
                          <div
                            className="bg-neutral-900 h-2 transition-all"
                            style={{
                              width: `${cartonDetails.progreso.porcentaje}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setCartonActual(null);
                    setCartonDetails(null);
                    setScanInput("");
                  }}
                  className="btn-ghost text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Input de Escaneo */}
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {!cartonActual
                  ? "Escanear Cartón"
                  : cartonActual.tipo === "mono_sku"
                  ? "Escanear Caja"
                  : "Escanear Par"}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder={
                  !cartonActual
                    ? "Código del cartón..."
                    : cartonActual.tipo === "mono_sku"
                    ? "Código de la caja (con $)..."
                    : "Código QR del par..."
                }
                className="input font-mono"
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={!scanInput.trim() || loading}
              className="btn-primary w-full"
            >
              {loading
                ? "Procesando..."
                : !cartonActual
                ? "Seleccionar Cartón"
                : cartonActual.tipo === "mono_sku"
                ? "Asignar Caja"
                : "Escanear Par"}
            </button>
          </form>
        </div>
      )}

      {/* Instrucciones */}
      {selectedPo && (
        <div className="border border-neutral-200 p-6 max-w-2xl mx-auto">
          <h3 className="text-sm font-medium text-neutral-900 mb-3">
            Instrucciones
          </h3>
          <div className="space-y-4 text-sm text-neutral-600">
            <div>
              <p className="font-medium text-neutral-900 mb-1">
                Cartones Mono-SKU:
              </p>
              <ol className="space-y-1 ml-4">
                <li>1. Escanea el código del cartón</li>
                <li>
                  2. Escanea el código de la caja empacada (con símbolo $)
                </li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-neutral-900 mb-1">
                Cartones Musicales:
              </p>
              <ol className="space-y-1 ml-4">
                <li>1. Escanea el código del cartón</li>
                <li>2. Escanea cada código QR de los pares</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingPage;
