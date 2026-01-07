import { useState } from "react";
import { Upload, FileText, QrCode, Package } from "lucide-react";
import { skuService, qrService, poService } from "../services/api";
import toast from "react-hot-toast";

const ImportPage = () => {
  const [loading, setLoading] = useState({
    skus: false,
    qr: false,
    po: false,
  });

  const handleFileImport = async (type, file) => {
    if (!file) return;

    setLoading((prev) => ({ ...prev, [type]: true }));

    try {
      let response;
      if (type === "skus") {
        response = await skuService.importSkus(file);
      } else if (type === "po") {
        response = await poService.importPurchaseOrder(file);
      }

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.error || "Error en la importación");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al importar archivo");
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleQrImport = async () => {
    setLoading((prev) => ({ ...prev, qr: true }));

    try {
      const response = await qrService.importQrCodes();

      if (response.data.success) {
        toast.success(`${response.data.data.inserted} códigos QR importados`);
      } else {
        toast.error(response.data.error || "Error en la importación");
      }
    } catch (error) {
      toast.error("Error al importar códigos QR");
    } finally {
      setLoading((prev) => ({ ...prev, qr: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
          Importar Datos
        </h1>
        <p className="text-sm text-neutral-500">
          Importa los datos necesarios para el sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SKUs */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center">
              <FileText className="h-5 w-5 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-900">SKUs</h2>
              <p className="text-xs text-neutral-500">Desde Excel</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Importa el catálogo de SKUs desde un archivo Excel
          </p>
          <label className="btn-primary w-full cursor-pointer">
            {loading.skus ? "Importando..." : "Seleccionar Archivo"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileImport("skus", e.target.files[0])}
              disabled={loading.skus}
            />
          </label>
        </div>

        {/* QR Codes */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-900">
                Códigos QR
              </h2>
              <p className="text-xs text-neutral-500">Desde API</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Importa códigos QR desde la API de Trysor
          </p>
          <button
            onClick={handleQrImport}
            disabled={loading.qr}
            className="btn-primary w-full"
          >
            {loading.qr ? "Importando..." : "Importar desde API"}
          </button>
        </div>

        {/* PO */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center">
              <Package className="h-5 w-5 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-900">
                Purchase Order
              </h2>
              <p className="text-xs text-neutral-500">Desde Excel</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Importa PO con cartones desde un archivo Excel
          </p>
          <label className="btn-primary w-full cursor-pointer">
            {loading.po ? "Importando..." : "Seleccionar Archivo"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileImport("po", e.target.files[0])}
              disabled={loading.po}
            />
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="border border-neutral-200 p-6">
        <h3 className="text-sm font-medium text-neutral-900 mb-3">
          Orden de Importación
        </h3>
        <ol className="space-y-2 text-sm text-neutral-600">
          <li className="flex">
            <span className="text-neutral-400 mr-3">1.</span>
            <span>Importar SKUs (catálogo de productos)</span>
          </li>
          <li className="flex">
            <span className="text-neutral-400 mr-3">2.</span>
            <span>Importar Códigos QR (desde Trysor API)</span>
          </li>
          <li className="flex">
            <span className="text-neutral-400 mr-3">3.</span>
            <span>Importar Purchase Orders (órdenes de producción)</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ImportPage;
