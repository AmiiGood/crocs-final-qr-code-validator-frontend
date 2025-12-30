import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ScanLine,
  CheckCircle,
  XCircle,
  Package,
  Loader,
  Scan,
} from "lucide-react";
import { cartonService, poService } from "../services/api";
import toast from "react-hot-toast";

const ScanPage = () => {
  const [searchParams] = useSearchParams();
  const [pos, setPos] = useState([]);
  const [selectedPo, setSelectedPo] = useState(searchParams.get("po") || "");
  const [cartones, setCartones] = useState([]);
  const [selectedCarton, setSelectedCarton] = useState(null);
  const [cartonDetails, setCartonDetails] = useState(null);
  const [qrInput, setQrInput] = useState("");
  const [cartonInput, setCartonInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState("carton"); // 'carton' o 'qr'
  const [loading, setLoading] = useState(false);
  const qrInputRef = useRef(null);
  const cartonInputRef = useRef(null);

  useEffect(() => {
    loadPos();
  }, []);

  useEffect(() => {
    if (selectedPo) {
      loadCartones();
    }
  }, [selectedPo]);

  useEffect(() => {
    if (selectedCarton) {
      loadCartonDetails();
    }
  }, [selectedCarton]);

  // Auto-focus en el input correspondiente según el modo
  useEffect(() => {
    if (scanMode === "carton" && cartonInputRef.current) {
      cartonInputRef.current.focus();
    } else if (scanMode === "qr" && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [scanMode, scanning]);

  const loadPos = async () => {
    try {
      const response = await poService.getAllPurchaseOrders();
      setPos(
        response.data.data.filter(
          (po) => po.estado === "importada" || po.estado === "en_proceso"
        )
      );
    } catch (error) {
      toast.error("Error al cargar POs");
    }
  };

  const loadCartones = async () => {
    setLoading(true);
    try {
      const response = await cartonService.getCartonesByPo(selectedPo);
      setCartones(response.data.data);
    } catch (error) {
      toast.error("Error al cargar cartones");
    } finally {
      setLoading(false);
    }
  };

  const loadCartonDetails = async () => {
    try {
      const response = await cartonService.getCartonById(selectedCarton);
      setCartonDetails(response.data.data);
    } catch (error) {
      toast.error("Error al cargar detalles del cartón");
    }
  };

  /**
   * Limpia el código QR escaneado para extraer solo el código real
   * Ejemplo: "httpsÑ--verify.crocs.com-Q-66QAKYGBRAHX" → "66QAKYGBRAHX"
   */
  const cleanQrCode = (rawCode) => {
    if (!rawCode) return "";

    // Limpiar el código
    let cleaned = rawCode.trim();

    // Si contiene "verify.crocs.com" o variaciones, extraer solo el código final
    if (
      cleaned.includes("verify.crocs.com") ||
      cleaned.includes("verify-crocs-com")
    ) {
      // Buscar el último segmento después de guiones o barras
      const parts = cleaned.split(/[-\/]/);
      cleaned = parts[parts.length - 1];
    }

    // Si empieza con "Q-" o "Q/" o similar, quitar ese prefijo
    cleaned = cleaned.replace(/^[Qq][-\/]/i, "");

    // Remover cualquier caracter especial que no sea alfanumérico
    cleaned = cleaned.replace(/[^A-Za-z0-9]/g, "");

    // Convertir a mayúsculas para consistencia
    cleaned = cleaned.toUpperCase();

    console.log("🧹 Código limpio:", rawCode, "→", cleaned);

    return cleaned;
  };

  const handleStartScan = async (cartonId) => {
    try {
      await cartonService.startScan(cartonId);
      setSelectedCarton(cartonId);
      setScanning(true);
      setScanMode("qr"); // Cambiar a modo QR después de seleccionar cartón
      toast.success("Escaneo iniciado");

      // Focus en input de QR después de un momento
      setTimeout(() => {
        qrInputRef.current?.focus();
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al iniciar escaneo");
    }
  };

  /**
   * Maneja el escaneo del ID del cartón
   */
  const handleScanCarton = async (e) => {
    e.preventDefault();

    if (!cartonInput.trim()) return;

    const cartonId = cartonInput.trim().toUpperCase();

    // Buscar el cartón por su carton_id
    const carton = cartones.find((c) => c.carton_id.toUpperCase() === cartonId);

    if (!carton) {
      toast.error(`Cartón "${cartonId}" no encontrado en esta PO`);
      setCartonInput("");
      cartonInputRef.current?.focus();
      return;
    }

    // Si el cartón ya está completo, mostrar mensaje y no hacer nada
    if (carton.estado === "completo") {
      toast.success(`✅ Cartón "${cartonId}" ya está completo`, {
        icon: "✓",
        duration: 2000,
      });
      setCartonInput("");
      cartonInputRef.current?.focus();
      return;
    }

    // Iniciar escaneo del cartón encontrado automáticamente
    setCartonInput("");
    await handleStartScan(carton.id);
  };

  const handleScanQr = async (e) => {
    e.preventDefault();

    if (!qrInput.trim()) return;

    // Limpiar el código QR
    const cleanedCode = cleanQrCode(qrInput);

    if (!cleanedCode) {
      toast.error("Código QR inválido");
      setQrInput("");
      qrInputRef.current?.focus();
      return;
    }

    console.log("📱 Escaneando código:", cleanedCode);

    try {
      const response = await cartonService.scanQr(selectedCarton, cleanedCode);

      console.log("📦 Respuesta del servidor:", response.data);

      if (response.data.success) {
        console.log("✅ Escaneo exitoso");

        // Verificar si el cartón ya estaba completo antes de este escaneo
        if (response.data.alreadyComplete) {
          console.log("⚠️ Cartón ya estaba completo");
          toast.success(
            "⚠️ Este cartón ya está completo. Escanea el siguiente",
            {
              duration: 3000,
              icon: "✓",
            }
          );

          // Resetear para escanear el siguiente
          setScanning(false);
          setSelectedCarton(null);
          setCartonDetails(null);
          setQrInput("");
          loadCartones();

          setTimeout(() => {
            cartonInputRef.current?.focus();
          }, 100);
          return;
        }

        console.log(
          "   - Cartón completo:",
          response.data.data.carton.completo
        );
        console.log(
          "   - Cantidad escaneada:",
          response.data.data.detalle?.cantidadEscaneada
        );
        console.log(
          "   - Cantidad requerida:",
          response.data.data.detalle?.cantidadRequerida
        );

        if (response.data.data.carton.completo) {
          // ¡Cartón completado! Volver al estado inicial para escanear el siguiente
          toast.success("🎉 ¡Cartón completado! Listo para el siguiente", {
            duration: 3000,
            icon: "🎉",
          });

          // Resetear todo para el siguiente cartón
          setScanning(false);
          setSelectedCarton(null);
          setCartonDetails(null);
          setQrInput("");

          // Recargar lista de cartones
          loadCartones();

          // Auto-focus en input de cartón para continuar el flujo
          setTimeout(() => {
            cartonInputRef.current?.focus();
          }, 100);
        } else {
          // Escaneo exitoso pero cartón no completo
          toast.success(
            `✅ Escaneo exitoso (${response.data.data.detalle.cantidadEscaneada}/${response.data.data.detalle.cantidadRequerida})`
          );
          await loadCartonDetails(); // Recargar detalles para actualizar progreso

          // Mantener focus en input de QR
          setQrInput("");
          qrInputRef.current?.focus();
        }
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Error al escanear código QR";
      toast.error(errorMsg);
      setQrInput("");
      qrInputRef.current?.focus();
    }
  };

  const handleCancelScan = () => {
    setScanning(false);
    setSelectedCarton(null);
    setCartonDetails(null);
    setQrInput("");
    setScanMode("carton"); // Volver a modo cartón
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Escaneo de Cartones</h1>

      {/* Seleccionar PO */}
      {!scanning && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Purchase Order
          </label>
          <select
            value={selectedPo}
            onChange={(e) => setSelectedPo(e.target.value)}
            className="input-field"
          >
            <option value="">-- Seleccionar PO --</option>
            {pos.map((po) => (
              <option key={po.id} value={po.po_number}>
                {po.po_number} - {po.cartones_completos || 0}/
                {po.cartones_totales || po.cantidad_cartones} cartones
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Escanear ID del Cartón - Siempre visible y accesible cuando hay PO seleccionada */}
      {selectedPo && (
        <div
          className={`card transition-all ${
            !scanning
              ? "bg-primary-50 border-2 border-primary-200"
              : "bg-white border-2 border-gray-200"
          }`}
        >
          <form onSubmit={handleScanCarton}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Scan className="inline h-5 w-5 mr-2" />
                {scanning
                  ? "Escanear Siguiente Cartón"
                  : "Escanear ID del Cartón"}
              </label>
              {scanning && (
                <span className="text-xs text-gray-500 italic">
                  (Termina el cartón actual primero)
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <input
                ref={cartonInputRef}
                type="text"
                value={cartonInput}
                onChange={(e) => setCartonInput(e.target.value)}
                placeholder={
                  scanning
                    ? "Listo para escanear el siguiente cartón..."
                    : "Escanea el código de barras del cartón..."
                }
                className={`input-field flex-1 text-lg font-mono ${
                  scanning ? "bg-gray-100" : ""
                }`}
                autoFocus={!scanning}
              />
              <button
                type="submit"
                className={`px-8 font-semibold py-2 rounded-lg transition-colors ${
                  scanning
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                }`}
                disabled={scanning}
              >
                Buscar
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {scanning
                ? "⏳ Termina de escanear los QR del cartón actual. Al completarlo, podrás escanear el siguiente aquí."
                : "💡 Escanea el código de barras del cartón para iniciar el escaneo de pares"}
            </p>
          </form>
        </div>
      )}

      {/* Lista de Cartones */}
      {selectedPo && !scanning && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Cartones de PO {selectedPo}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin h-8 w-8 text-primary-600" />
            </div>
          ) : cartones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cartones.map((carton) => (
                <div
                  key={carton.id}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${
                      carton.estado === "completo"
                        ? "border-green-300 bg-green-50"
                        : carton.estado === "en_proceso"
                        ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400"
                        : "border-gray-300 bg-white hover:border-primary-400"
                    }
                  `}
                  onClick={() =>
                    carton.estado !== "completo" && handleStartScan(carton.id)
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{carton.carton_id}</h3>
                      <p className="text-sm text-gray-600">
                        {carton.tipo === "mono_sku" ? "Mono SKU" : "Musical"}
                      </p>
                    </div>
                    {carton.estado === "completo" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso:</span>
                      <span className="font-medium">
                        {carton.total_pares_escaneados}/
                        {carton.total_pares_requeridos} pares
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          carton.porcentaje_completado >= 100
                            ? "bg-green-600"
                            : "bg-primary-600"
                        }`}
                        style={{ width: `${carton.porcentaje_completado}%` }}
                      ></div>
                    </div>

                    <span
                      className={`badge ${
                        carton.estado === "completo"
                          ? "badge-success"
                          : carton.estado === "en_proceso"
                          ? "badge-warning"
                          : "badge-info"
                      }`}
                    >
                      {carton.estado === "completo"
                        ? "Completo"
                        : carton.estado === "en_proceso"
                        ? "En Proceso"
                        : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay cartones disponibles para esta PO
            </p>
          )}
        </div>
      )}

      {/* Panel de Escaneo Activo */}
      {scanning && cartonDetails && (
        <div className="card bg-primary-50 border-2 border-primary-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Escaneando: {cartonDetails.carton.carton_id}
              </h2>
              <p className="text-gray-600">
                {cartonDetails.carton.tipo === "mono_sku"
                  ? "Mono SKU"
                  : "Musical"}
              </p>
            </div>
            <button onClick={handleCancelScan} className="btn-danger">
              Cancelar Escaneo
            </button>
          </div>

          {/* Progreso por SKU */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Progreso por SKU:
            </h3>
            <div className="space-y-3">
              {cartonDetails.detalles.map((detalle) => (
                <div
                  key={detalle.id}
                  className="border-l-4 border-primary-500 pl-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {detalle.sku_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detalle.style_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {detalle.color_name} - {detalle.size}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
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

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        detalle.cantidad_escaneada >= detalle.cantidad_requerida
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${
                          (detalle.cantidad_escaneada /
                            detalle.cantidad_requerida) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input de Escaneo QR */}
          <form onSubmit={handleScanQr} className="bg-white rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ScanLine className="inline h-5 w-5 mr-2" />
              Escanear Código QR
            </label>
            <div className="flex space-x-2">
              <input
                ref={qrInputRef}
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Escanea el código QR aquí..."
                className="input-field flex-1 text-lg font-mono"
                autoFocus
              />
              <button type="submit" className="btn-primary px-8">
                Validar
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              💡 El sistema limpia automáticamente el código escaneado (ej:
              "httpsÑ--verify.crocs.com-Q-66QAKYGBRAHX" → "66QAKYGBRAHX")
            </p>
          </form>

          {/* Progreso General */}
          <div className="mt-6 bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Progreso Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                {cartonDetails.progreso.porcentaje.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${cartonDetails.progreso.porcentaje}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {cartonDetails.progreso.totalEscaneado} /{" "}
              {cartonDetails.progreso.totalRequerido} pares escaneados
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
