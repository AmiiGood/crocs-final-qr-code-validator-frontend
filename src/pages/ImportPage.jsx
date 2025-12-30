import { useState } from 'react';
import { Upload, FileText, QrCode, Package } from 'lucide-react';
import { skuService, qrService, poService } from '../services/api';
import toast from 'react-hot-toast';

const ImportPage = () => {
  const [loading, setLoading] = useState({ skus: false, qr: false, po: false });

  const handleFileImport = async (type, file) => {
    if (!file) return;
    
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      let response;
      if (type === 'skus') {
        response = await skuService.importSkus(file);
      } else if (type === 'po') {
        response = await poService.importPurchaseOrder(file);
      }
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.error || 'Error en la importación');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al importar archivo');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleQrImport = async () => {
    setLoading(prev => ({ ...prev, qr: true }));
    
    try {
      const response = await qrService.importQrCodes();
      
      if (response.data.success) {
        toast.success(`${response.data.data.inserted} códigos QR importados`);
      } else {
        toast.error(response.data.error || 'Error en la importación');
      }
    } catch (error) {
      toast.error('Error al importar códigos QR');
    } finally {
      setLoading(prev => ({ ...prev, qr: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Importar Datos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Importar SKUs */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-bold">SKUs</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Importa el catálogo de SKUs desde Excel
          </p>
          <label className="btn-primary cursor-pointer block text-center">
            {loading.skus ? 'Importando...' : 'Seleccionar Archivo'}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileImport('skus', e.target.files[0])}
              disabled={loading.skus}
            />
          </label>
        </div>

        {/* Importar QR Codes */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <QrCode className="h-8 w-8 text-purple-600" />
            <h2 className="text-xl font-bold">Códigos QR</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Importa códigos QR desde API de Trysor
          </p>
          <button
            onClick={handleQrImport}
            disabled={loading.qr}
            className="btn-primary w-full"
          >
            {loading.qr ? 'Importando...' : 'Importar desde API'}
          </button>
        </div>

        {/* Importar PO */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="h-8 w-8 text-green-600" />
            <h2 className="text-xl font-bold">Purchase Order</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Importa PO con cartones desde Excel
          </p>
          <label className="btn-primary cursor-pointer block text-center">
            {loading.po ? 'Importando...' : 'Seleccionar Archivo'}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileImport('po', e.target.files[0])}
              disabled={loading.po}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
