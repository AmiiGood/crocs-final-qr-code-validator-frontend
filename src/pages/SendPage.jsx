import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, XCircle, Eye, CheckCircle } from 'lucide-react';
import { trysorService, poService } from '../services/api';
import toast from 'react-hot-toast';

const SendPage = () => {
  const [searchParams] = useSearchParams();
  const [pos, setPos] = useState([]);
  const [selectedPo, setSelectedPo] = useState(searchParams.get('po') || '');
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPos();
  }, []);

  useEffect(() => {
    if (selectedPo) {
      validatePo();
    }
  }, [selectedPo]);

  const loadPos = async () => {
    try {
      const response = await poService.getAllPurchaseOrders();
      setPos(response.data.data.filter(po => 
        po.estado === 'completada' || po.estado === 'importada'
      ));
    } catch (error) {
      toast.error('Error al cargar POs');
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
      toast.success('Vista previa generada');
    } catch (error) {
      toast.error('Error al generar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!window.confirm(`¿Enviar PO ${selectedPo} a T4 API?`)) return;
    
    setLoading(true);
    try {
      const response = await trysorService.sendPo(selectedPo);
      if (response.data.success) {
        toast.success('PO enviada exitosamente a T4');
        loadPos();
        setValidation(null);
        setPreview(null);
        setSelectedPo('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar PO');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`¿Cancelar PO ${selectedPo} en T4 API?`)) return;
    
    setLoading(true);
    try {
      const response = await trysorService.cancelPo(selectedPo);
      if (response.data.success) {
        toast.success('PO cancelada exitosamente');
        loadPos();
        setValidation(null);
        setPreview(null);
        setSelectedPo('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cancelar PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Enviar a T4 API</h1>

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
              {po.po_number} - {po.estado}
            </option>
          ))}
        </select>
      </div>

      {validation && (
        <div className={`card ${validation.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {validation.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            <div>
              <h3 className="font-bold text-lg mb-2">
                {validation.success ? '✅ PO Lista para Enviar' : '❌ PO No Lista'}
              </h3>
              <p className="text-gray-700">{validation.message}</p>
            </div>
          </div>

          {validation.success && (
            <div className="mt-4 flex space-x-3">
              <button onClick={handlePreview} className="btn-secondary" disabled={loading}>
                <Eye className="h-5 w-5 inline mr-2" />
                Vista Previa
              </button>
              <button onClick={handleSend} className="btn-primary" disabled={loading}>
                <Send className="h-5 w-5 inline mr-2" />
                {loading ? 'Enviando...' : 'Enviar a T4'}
              </button>
              <button onClick={handleCancel} className="btn-danger" disabled={loading}>
                <XCircle className="h-5 w-5 inline mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Vista Previa de Datos</h3>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm">{JSON.stringify(preview.trysorData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendPage;
