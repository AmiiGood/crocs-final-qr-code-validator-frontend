import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Package, Send, Search } from "lucide-react";
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

    // Si es URL de Crocs, extraer solo el código
    if (
      cleaned.includes("verify.crocs.com") ||
      cleaned.includes("VERIFY.CROCS.COM")
    ) {
      const parts = cleaned.split(/[\/]/);
      cleaned = parts[parts.length - 1];
    }

    // Remover prefijo Q- si existe
    cleaned = cleaned.replace(/^Q[-\/]/i, "");

    // IMPORTANTE: Si tiene $, es código de caja, preservar guiones
    if (cleaned.includes("$")) {
      // Solo remover caracteres especiales raros, pero mantener guiones
      return cleaned.replace(/[^A-Z0-9$\-]/g, "");
    } else {
      // Es QR code, remover todo excepto alfanuméricos
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

      console.log("📦 Cartones cargados:", cartonesRes.data.data);
      console.log("   - Mono-SKU:", cartonesRes.data.data.monoSku.length);
      console.log("   - Musical:", cartonesRes.data.data.musical.length);

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

    console.log("🔍 Escaneando:", cleaned);

    const esCaja = cleaned.includes("$");

    if (!cartonActual) {
      // No hay cartón seleccionado - debe ser código de cartón
      if (esCaja) {
        toast.error("⚠️ Primero escanea el cartón, no la caja");
        setScanInput("");
        return;
      }
      await seleccionarCarton(cleaned);
    } else {
      // Ya hay cartón seleccionado
      if (cartonActual.tipo === "mono_sku") {
        // Mono-SKU: debe escanear caja
        if (!esCaja) {
          toast.error("⚠️ Escanea el código de la caja (con símbolo $)");
          setScanInput("");
          return;
        }
        await asignarCaja(cleaned);
      } else {
        // Musical: debe escanear QR
        if (esCaja) {
          toast.error(
            "⚠️ Los cartones musicales no usan cajas. Escanea el QR del par"
          );
          setScanInput("");
          return;
        }
        await escanearParMusical(cleaned);
      }
    }
  };

  const seleccionarCarton = async (codigo) => {
    console.log("🔎 Buscando cartón:", codigo);
    console.log("📋 Cartones disponibles:");
    console.log(
      "   Mono-SKU:",
      cartones.monoSku.map((c) => c.carton_id)
    );
    console.log(
      "   Musical:",
      cartones.musical.map((c) => c.carton_id)
    );

    // Buscar en mono-SKU
    let carton = cartones.monoSku.find(
      (c) => c.carton_id.toUpperCase() === codigo
    );
    let tipo = "mono_sku";

    // Si no está en mono-SKU, buscar en musical
    if (!carton) {
      carton = cartones.musical.find(
        (c) => c.carton_id.toUpperCase() === codigo
      );
      tipo = "musical";
    }

    if (!carton) {
      console.error("❌ Cartón no encontrado:", codigo);

      // Mostrar sugerencias
      const todosCodigos = [
        ...cartones.monoSku.map((c) => c.carton_id),
        ...cartones.musical.map((c) => c.carton_id),
      ];

      console.log("💡 ¿Quisiste decir alguno de estos?");
      todosCodigos.forEach((c) => console.log("   -", c));

      toast.error(
        <div>
          <p className="font-bold">
            Cartón "{codigo}" no encontrado en esta PO
          </p>
          <p className="text-sm mt-1">Verifica que el código sea correcto</p>
          <button
            onClick={() => setShowDebug(true)}
            className="text-xs underline mt-1"
          >
            Ver cartones disponibles
          </button>
        </div>,
        { duration: 5000 }
      );

      setScanInput("");
      return;
    }

    console.log("✅ Cartón encontrado:", carton);

    // Si es mono-SKU y ya tiene caja
    if (tipo === "mono_sku" && carton.caja_asignada) {
      toast.success(`✅ Cartón "${codigo}" ya está completo`, {
        duration: 2000,
      });
      setScanInput("");
      return;
    }

    // Si es musical, cargar detalles
    if (tipo === "musical") {
      try {
        await cartonService.startScan(carton.id);
        const response = await cartonService.getCartonById(carton.id);
        setCartonDetails(response.data.data);
        console.log("📦 Detalles del cartón musical:", response.data.data);
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
      `Cartón ${codigo} seleccionado. ${
        tipo === "mono_sku" ? "Escanea la caja" : "Escanea los pares"
      }`,
      { duration: 2000 }
    );
  };

  const asignarCaja = async (codigoCaja) => {
    console.log(
      "📦 Asignando caja:",
      codigoCaja,
      "al cartón:",
      cartonActual.id
    );

    try {
      const response = await embarqueService.assignBoxToCarton(
        codigoCaja,
        cartonActual.id
      );

      console.log("📦 Respuesta de asignación:", response.data);

      if (response.data.success) {
        toast.success("🎉 ¡Cartón completado!", { duration: 2500 });
        setTimeout(() => {
          setCartonActual(null);
          setScanInput("");
          loadCartones();
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error al asignar caja:", error);
      toast.error(error.response?.data?.error || "Error al asignar caja");
      setScanInput("");
    }
  };

  const escanearParMusical = async (codigo) => {
    try {
      const response = await cartonService.scanQr(cartonActual.id, codigo);
      if (response.data.success) {
        if (response.data.alreadyComplete) {
          toast.success("⚠️ Este cartón ya está completo", { duration: 2000 });
          setCartonActual(null);
          setCartonDetails(null);
          setScanInput("");
          loadCartones();
          return;
        }

        if (response.data.data.carton.completo) {
          toast.success("🎉 ¡Cartón completado!", { duration: 2500 });
          setTimeout(() => {
            setCartonActual(null);
            setCartonDetails(null);
            setScanInput("");
            loadCartones();
          }, 1500);
        } else {
          toast.success(
            `✅ ${response.data.data.detalle.cantidadEscaneada}/${response.data.data.detalle.cantidadRequerida}`,
            { duration: 1000 }
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
        toast.success("✅ PO enviada exitosamente a T4");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">🚚 Embarque</h1>
          <p className="text-xl text-gray-600">
            Asigna cajas a cartones y completa el embarque
          </p>
        </div>

        {/* Modal de Debug */}
        {showDebug && cartones && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">🔍 Cartones Disponibles</h2>
                <button
                  onClick={() => setShowDebug(false)}
                  className="text-3xl font-bold text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">
                    Mono-SKU ({cartones.monoSku.length})
                  </h3>
                  <div className="space-y-2">
                    {cartones.monoSku.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <p className="font-mono font-bold">{c.carton_id}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {c.sku_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.caja_asignada
                            ? "✅ Caja asignada"
                            : "⏳ Pendiente"}
                        </p>
                      </div>
                    ))}
                    {cartones.monoSku.length === 0 && (
                      <p className="text-gray-500 italic">
                        No hay cartones mono-SKU pendientes
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-purple-600 mb-3">
                    Musical ({cartones.musical.length})
                  </h3>
                  <div className="space-y-2">
                    {cartones.musical.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <p className="font-mono font-bold">{c.carton_id}</p>
                        <p className="text-sm text-gray-600">
                          {c.total_skus} SKUs
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.total_pares_escaneados}/{c.total_pares_requeridos}{" "}
                          pares
                        </p>
                      </div>
                    ))}
                    {cartones.musical.length === 0 && (
                      <p className="text-gray-500 italic">
                        No hay cartones musicales pendientes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selector de PO y Botón de Envío */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-4 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-lg font-bold text-gray-700 mb-2">
                📋 Purchase Order
              </label>
              <select
                value={selectedPo}
                onChange={(e) => {
                  setSelectedPo(e.target.value);
                  setCartonActual(null);
                  setCartonDetails(null);
                  setShowDebug(false);
                }}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={cartonActual}
              >
                <option value="">-- Seleccionar PO --</option>
                {pos.map((po) => (
                  <option key={po.id} value={po.po_number}>
                    {po.po_number} ({po.cartones_completos || 0}/
                    {po.cartones_totales || po.cantidad_cartones})
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="pt-8 flex gap-2">
              {selectedPo && cartones && !cartonActual && (
                <button
                  onClick={() => setShowDebug(true)}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Ver Cartones
                </button>
              )}

              {selectedPo && esPoCompleta && !cartonActual && (
                <button
                  onClick={handleEnviarPo}
                  disabled={sending}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black text-xl rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {sending ? "⏳ Enviando..." : "📤 Enviar a T4"}
                </button>
              )}
            </div>
          </div>

          {/* Resumen de Cartones */}
          {selectedPo && cartones && !cartonActual && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-700 mb-1">
                    MONO-SKU
                  </p>
                  <p className="text-4xl font-black text-blue-600">
                    {cartones.monoSku.filter((c) => !c.caja_asignada).length}
                  </p>
                  <p className="text-sm text-gray-600">pendientes</p>
                </div>
              </div>
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-purple-700 mb-1">
                    MUSICAL
                  </p>
                  <p className="text-4xl font-black text-purple-600">
                    {cartones.musical.length}
                  </p>
                  <p className="text-sm text-gray-600">pendientes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Principal */}
        {selectedPo && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-purple-200">
            {/* Info de Cartón Actual */}
            {cartonActual && (
              <div className="mb-8 pb-8 border-b-4 border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg mb-3 ${
                        cartonActual.tipo === "mono_sku"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          cartonActual.tipo === "mono_sku"
                            ? "text-blue-700"
                            : "text-purple-700"
                        }`}
                      >
                        {cartonActual.tipo === "mono_sku"
                          ? "MONO-SKU"
                          : "MUSICAL"}
                      </p>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      {cartonActual.carton_id}
                    </h2>

                    {/* Info Mono-SKU */}
                    {cartonActual.tipo === "mono_sku" && (
                      <div className="space-y-1">
                        <p className="text-lg text-gray-700">
                          <span className="font-semibold">SKU:</span>{" "}
                          {cartonActual.sku_number}
                        </p>
                        <p className="text-lg text-gray-700">
                          {cartonActual.style_name}
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {cartonActual.cantidad_requerida} pares
                        </p>
                      </div>
                    )}

                    {/* Info Musical */}
                    {cartonActual.tipo === "musical" && cartonDetails && (
                      <div>
                        <p className="text-lg text-gray-700 mb-4">
                          {cartonDetails.detalles.length} SKUs diferentes
                        </p>

                        {/* Progreso por SKU */}
                        <div className="space-y-3 mb-4">
                          {cartonDetails.detalles.map((detalle) => (
                            <div
                              key={detalle.id}
                              className="border-l-4 border-purple-600 pl-4 py-2 bg-purple-50 rounded-r-lg"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {detalle.sku_number}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {detalle.style_name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xl">
                                    {detalle.cantidad_escaneada}/
                                    {detalle.cantidad_requerida}
                                  </p>
                                  {detalle.cantidad_escaneada >=
                                  detalle.cantidad_requerida ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 inline" />
                                  ) : (
                                    <span className="text-sm text-gray-600">
                                      Faltan{" "}
                                      {detalle.cantidad_requerida -
                                        detalle.cantidad_escaneada}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progreso Total */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-gray-700">
                              Total
                            </span>
                            <span className="text-3xl font-black text-purple-600">
                              {cartonDetails.progreso.porcentaje.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-8">
                            <div
                              className="bg-purple-600 h-8 rounded-full transition-all"
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
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Input de Escaneo */}
            <form onSubmit={handleScan} className="space-y-6">
              <div>
                <label className="block text-center mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {!cartonActual
                      ? "🔍 Escanear Cartón"
                      : cartonActual.tipo === "mono_sku"
                      ? "🔍 Escanear Caja"
                      : "🔍 Escanear Par"}
                  </span>
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
                  className="w-full px-6 py-6 text-3xl font-mono text-center border-4 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={!scanInput.trim() || loading}
                className={`w-full py-6 text-2xl font-black rounded-xl transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  !cartonActual
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : cartonActual.tipo === "mono_sku"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loading
                  ? "⏳ Procesando..."
                  : !cartonActual
                  ? "📦 Seleccionar Cartón"
                  : cartonActual.tipo === "mono_sku"
                  ? "✅ Asignar Caja"
                  : "✅ Escanear Par"}
              </button>
            </form>
          </div>
        )}

        {/* Ayuda */}
        {selectedPo && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  💡 Instrucciones
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      Cartones Mono-SKU:
                    </p>
                    <ol className="text-gray-700 ml-4">
                      <li>1. Escanea el código del cartón</li>
                      <li>
                        2. Escanea el código de la caja empacada (con símbolo $)
                      </li>
                      <li>3. ¡Listo! El cartón queda completo</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      Cartones Musicales:
                    </p>
                    <ol className="text-gray-700 ml-4">
                      <li>1. Escanea el código del cartón</li>
                      <li>2. Escanea cada código QR de los pares</li>
                      <li>
                        3. Cuando completes todos los SKUs, el cartón queda
                        listo
                      </li>
                    </ol>
                  </div>
                  <div className="pt-2 border-t border-yellow-300">
                    <p className="font-bold text-blue-700">
                      🔍 Si no encuentras un cartón, usa el botón "Ver Cartones"
                      para ver todos los disponibles
                    </p>
                  </div>
                  <div className="pt-2 border-t border-yellow-300">
                    <p className="font-bold text-green-700">
                      ✅ Cuando todos los cartones estén completos, el botón
                      "Enviar a T4" aparecerá automáticamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingPage;
