import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cajaService } from "../services/api";
import toast from "react-hot-toast";

const ProductionPage = () => {
  const [cajaActual, setCajaActual] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Auto-focus inicial y cuando cambia la caja actual
  useEffect(() => {
    inputRef.current?.focus();
  }, [cajaActual]);

  // Mantener el focus SIEMPRE en el input
  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Re-enfocar cada 100ms
    const interval = setInterval(keepFocus, 100);

    // Re-enfocar cuando se hace click en cualquier parte
    const handleClick = () => {
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    document.addEventListener("click", handleClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    if (cajaActual) {
      const interval = setInterval(loadProgreso, 2000);
      return () => clearInterval(interval);
    }
  }, [cajaActual]);

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
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    const esCaja = cleaned.includes("$");

    if (esCaja) {
      await iniciarCaja(cleaned);
    } else {
      if (!cajaActual) {
        toast.error("Primero escanea una caja");
        setScanInput("");
        setTimeout(() => inputRef.current?.focus(), 0);
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
        toast.success("Caja iniciada");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al iniciar caja");
      setScanInput("");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const escanearPar = async (codigo) => {
    try {
      const response = await cajaService.scanQr(cajaActual.id, codigo);
      if (response.data.success) {
        const { completa, cantidad_escaneada, cantidad_requerida } =
          response.data.data.caja;

        if (completa) {
          toast.success("Caja completada");
          setTimeout(() => {
            setCajaActual(null);
            setProgreso(null);
            setScanInput("");
            inputRef.current?.focus();
          }, 1500);
        } else {
          toast.success(`${cantidad_escaneada}/${cantidad_requerida}`);
          await loadProgreso();
          setScanInput("");
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al escanear");
      setScanInput("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Producción
        </h1>
        <p className="text-sm text-neutral-500">
          {!cajaActual
            ? "Escanea el código de una caja para comenzar"
            : "Escanea cada par de zapatos"}
        </p>
      </div>

      <div className="card max-w-2xl mx-auto">
        {/* Info de Caja Actual */}
        {cajaActual && progreso && (
          <div className="mb-8 pb-8 border-b border-neutral-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-neutral-500 mb-1">CAJA ACTIVA</p>
                <h2 className="text-xl font-medium text-neutral-900 mb-3">
                  {cajaActual.codigo_caja}
                </h2>
                <div className="space-y-1 text-sm">
                  <p className="text-neutral-700">
                    <span className="text-neutral-500">SKU:</span>{" "}
                    {cajaActual.sku_number}
                  </p>
                  <p className="text-neutral-700">
                    <span className="text-neutral-500">Modelo:</span>{" "}
                    {cajaActual.style_name}
                  </p>
                  <p className="text-neutral-500 text-xs">
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
                className="btn-ghost text-xs"
              >
                Cancelar
              </button>
            </div>

            {/* Progreso */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  Progreso
                </span>
                <span className="text-2xl font-medium text-neutral-900">
                  {progreso.caja.cantidad_escaneada}/
                  {progreso.caja.cantidad_pares}
                </span>
              </div>

              <div className="relative w-full bg-neutral-200 h-2">
                <div
                  className={`h-2 transition-all duration-500 ${
                    progreso.completa ? "bg-neutral-900" : "bg-neutral-700"
                  }`}
                  style={{ width: `${progreso.caja.porcentaje}%` }}
                ></div>
              </div>

              {!progreso.completa && (
                <p className="text-sm text-neutral-600 text-center">
                  Faltan {progreso.restantes} pares
                </p>
              )}
            </div>
          </div>
        )}

        {/* Input de Escaneo */}
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {!cajaActual ? "Escanear Caja" : "Escanear Par"}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder={
                !cajaActual ? "Código de caja..." : "Código QR del par..."
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
              : !cajaActual
              ? "Iniciar Caja"
              : "Escanear Par"}
          </button>
        </form>

        {/* Historial */}
        {progreso?.historial && progreso.historial.length > 0 && (
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">
              Últimos Escaneos
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progreso.historial.slice(0, 8).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 text-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
                      {progreso.historial.length - index}
                    </div>
                    <span className="font-mono text-neutral-900">
                      {item.codigo_qr}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(item.fecha_escaneo).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="border border-neutral-200 p-6 max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          Instrucciones
        </h3>
        <ol className="space-y-2 text-sm text-neutral-600">
          <li className="flex">
            <span className="text-neutral-400 mr-3">1.</span>
            <span>
              Escanea el código de barras de la caja (tiene símbolo $)
            </span>
          </li>
          <li className="flex">
            <span className="text-neutral-400 mr-3">2.</span>
            <span>Escanea cada código QR de los pares uno por uno</span>
          </li>
          <li className="flex">
            <span className="text-neutral-400 mr-3">3.</span>
            <span>
              La caja se marca como lista automáticamente al completar
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ProductionPage;
