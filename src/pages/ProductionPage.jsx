import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle, Package } from "lucide-react";
import { cajaService } from "../services/api";
import toast from "react-hot-toast";

const ProductionPage = () => {
  const [cajaActual, setCajaActual] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Auto-focus constante
  useEffect(() => {
    inputRef.current?.focus();
  }, [cajaActual]);

  // Refrescar progreso automáticamente
  useEffect(() => {
    if (cajaActual) {
      const interval = setInterval(loadProgreso, 2000);
      return () => clearInterval(interval);
    }
  }, [cajaActual]);

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

  const loadProgreso = async () => {
    try {
      const response = await cajaService.getProgress(cajaActual.id);
      setProgreso(response.data.data);
    } catch (error) {
      console.error("Error al cargar progreso:", error);
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

    if (esCaja) {
      await iniciarCaja(cleaned);
    } else {
      if (!cajaActual) {
        toast.error("⚠️ Primero escanea una caja");
        setScanInput("");
        return;
      }
      await escanearPar(cleaned);
    }
  };

  const iniciarCaja = async (codigo) => {
    setLoading(true);
    try {
      const response = await cajaService.startPacking(codigo);
      if (response.data.success) {
        setCajaActual(response.data.data.caja);
        setScanInput("");
        await loadProgreso();
        toast.success("📦 Caja iniciada - Escanea los pares", {
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al iniciar caja");
      setScanInput("");
    } finally {
      setLoading(false);
    }
  };

  const escanearPar = async (codigo) => {
    try {
      const response = await cajaService.scanQr(cajaActual.id, codigo);
      if (response.data.success) {
        const { completa, cantidad_escaneada, cantidad_requerida } =
          response.data.data.caja;

        if (completa) {
          toast.success("🎉 ¡Caja completada!", { duration: 2500 });
          setTimeout(() => {
            setCajaActual(null);
            setProgreso(null);
            setScanInput("");
          }, 1500);
        } else {
          toast.success(`✅ ${cantidad_escaneada}/${cantidad_requerida}`, {
            duration: 1000,
          });
          await loadProgreso();
          setScanInput("");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al escanear");
      setScanInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            📦 Producción
          </h1>
          <p className="text-xl text-gray-600">
            {!cajaActual
              ? "Escanea el código de una caja para comenzar"
              : "Escanea cada par de zapatos"}
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-indigo-200">
          {/* Info de Caja Actual */}
          {cajaActual && progreso && (
            <div className="mb-8 pb-8 border-b-4 border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="inline-block bg-indigo-100 px-4 py-2 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-indigo-700">
                      CAJA ACTIVA
                    </p>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {cajaActual.codigo_caja}
                  </h2>
                  <div className="space-y-1">
                    <p className="text-lg text-gray-700">
                      <span className="font-semibold">SKU:</span>{" "}
                      {cajaActual.sku_number}
                    </p>
                    <p className="text-lg text-gray-700">
                      <span className="font-semibold">Modelo:</span>{" "}
                      {cajaActual.style_name}
                    </p>
                    <p className="text-gray-600">
                      {cajaActual.color_name} - {cajaActual.size}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("¿Cancelar esta caja?")) {
                      setCajaActual(null);
                      setProgreso(null);
                      setScanInput("");
                    }
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                >
                  ✕ Cancelar
                </button>
              </div>

              {/* Progreso Visual */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-700">
                    Progreso
                  </span>
                  <span className="text-6xl font-black text-indigo-600">
                    {progreso.caja.cantidad_escaneada}/
                    {progreso.caja.cantidad_pares}
                  </span>
                </div>

                <div className="relative w-full bg-gray-300 rounded-full h-16 mb-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-16 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${
                      progreso.completa ? "bg-green-500" : "bg-indigo-600"
                    }`}
                    style={{ width: `${progreso.caja.porcentaje}%` }}
                  >
                    <span className="text-white font-black text-2xl">
                      {progreso.caja.porcentaje.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {!progreso.completa && (
                  <p className="text-center text-3xl font-bold text-gray-700">
                    Faltan{" "}
                    <span className="text-indigo-600">
                      {progreso.restantes}
                    </span>{" "}
                    pares
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Input de Escaneo */}
          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label className="block text-center mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {!cajaActual ? "🔍 Escanear Caja" : "🔍 Escanear Par"}
                </span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder={
                  !cajaActual ? "Código de caja..." : "Código QR del par..."
                }
                className="w-full px-6 py-6 text-3xl font-mono text-center border-4 border-indigo-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={!scanInput.trim() || loading}
              className={`w-full py-6 text-2xl font-black rounded-xl transition-all shadow-lg ${
                !cajaActual
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
            >
              {loading
                ? "⏳ Procesando..."
                : !cajaActual
                ? "📦 Iniciar Caja"
                : "✅ Escanear Par"}
            </button>
          </form>

          {/* Historial */}
          {progreso?.historial && progreso.historial.length > 0 && (
            <div className="mt-8 pt-8 border-t-4 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                Últimos Escaneos
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {progreso.historial.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {progreso.historial.length - index}
                      </div>
                      <span className="font-mono font-semibold text-gray-900">
                        {item.codigo_qr}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.fecha_escaneo).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ayuda */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">
                💡 Instrucciones
              </h3>
              <ol className="space-y-1 text-gray-700">
                <li>
                  <strong>1.</strong> Escanea el código de barras de la caja
                  (tiene símbolo $)
                </li>
                <li>
                  <strong>2.</strong> Escanea cada código QR de los pares uno
                  por uno
                </li>
                <li>
                  <strong>3.</strong> Cuando completes todos los pares, la caja
                  se marca como lista automáticamente
                </li>
                <li>
                  <strong>4.</strong> Comienza con la siguiente caja
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;
