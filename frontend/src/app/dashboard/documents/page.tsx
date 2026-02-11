'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Image,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Camera,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Document } from '@/types';

const typeLabels: Record<string, string> = {
  INVOICE: 'Facture',
  QUOTE: 'Devis',
  CONTRACT: 'Contrat',
  ID_DOCUMENT: 'Piece d\'identite',
  OTHER: 'Autre',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = () => {
    setLoading(true);
    api
      .getDocuments(typeFilter || undefined)
      .then((res) => setDocuments(res as Document[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [typeFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(file);
      loadDocuments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce document?')) return;
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <div className="flex items-center gap-2">
          {/* Camera capture - visible on mobile */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2 sm:hidden"
            title="Prendre une photo"
          >
            <Camera className="h-4 w-4" />
            Photo
          </button>

          {/* File upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Upload...' : 'Telecharger'}
          </button>
        </div>
      </div>

      {/* Mobile quick-capture banner */}
      <div className="sm:hidden card bg-primary-50 border-primary-200">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="p-3 bg-primary-100 rounded-lg">
            <Camera className="h-6 w-6 text-primary-700" />
          </div>
          <div>
            <p className="font-medium text-primary-900">Capture rapide</p>
            <p className="text-xs text-primary-600">
              Photographiez une facture ou un bon pour OCR automatique
            </p>
          </div>
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['', 'INVOICE', 'QUOTE', 'CONTRACT', 'ID_DOCUMENT', 'OTHER'].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t ? typeLabels[t] : 'Tous'}
            </button>
          ),
        )}
      </div>

      {/* OCR Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selectedDoc.fileName}</h2>
              <button onClick={() => setSelectedDoc(null)}>
                <span className="text-gray-400 text-xl">&times;</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className={`badge-info`}>
                  {typeLabels[selectedDoc.type] || selectedDoc.type}
                </span>
                {selectedDoc.isProcessed ? (
                  <span className="badge-success ml-2">OCR traite</span>
                ) : (
                  <span className="badge-warning ml-2">En traitement</span>
                )}
              </div>
              {selectedDoc.ocrText && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Texte OCR
                  </h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap">
                    {selectedDoc.ocrText}
                  </pre>
                </div>
              )}
              {selectedDoc.ocrData && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Donnees extraites (IA)
                  </h3>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(selectedDoc.ocrData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun document</p>
          <p className="text-xs text-gray-400 mt-1">
            Telechargez un PDF ou une image pour l&apos;OCR automatique
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {doc.mimeType.startsWith('image') ? (
                    <Image className="h-5 w-5 text-purple-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {doc.fileName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </span>
                    <span className="badge-info text-xs">
                      {typeLabels[doc.type] || doc.type}
                    </span>
                    {doc.isProcessed ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" /> OCR
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Clock className="h-3 w-3" /> Traitement...
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.isProcessed && (
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                    title="Voir OCR"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
