'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'customers' | 'products';
  onImportComplete: () => void;
}

interface ParsedData {
  headers: string[];
  rows: any[][];
}

interface MappedData {
  [key: string]: any;
}

const CUSTOMER_FIELDS = {
  name: { label: 'Nom', required: true },
  phone: { label: 'Téléphone', required: false },
  email: { label: 'Email', required: false },
  address: { label: 'Adresse', required: false },
  totalDebt: { label: 'Dette totale', required: false },
  notes: { label: 'Notes', required: false }
};

const PRODUCT_FIELDS = {
  name: { label: 'Nom', required: true },
  unit: { label: 'Unité', required: true },
  quantity: { label: 'Quantité', required: false },
  buyPrice: { label: 'Prix d\'achat', required: true },
  sellPrice: { label: 'Prix de vente', required: true },
  minStockAlert: { label: 'Alerte stock', required: false },
  category: { label: 'Catégorie', required: false },
  description: { label: 'Description', required: false }
};

export default function ImportDialog({ isOpen, onClose, type, onImportComplete }: ImportDialogProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [previewData, setPreviewData] = useState<MappedData[]>([]);
  const [createBackup, setCreateBackup] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = type === 'customers' ? CUSTOMER_FIELDS : PRODUCT_FIELDS;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (file.name.endsWith('.csv')) {
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const rows = lines.slice(1).map(line =>
          line.split(',').map(cell => cell.replace(/"/g, '').trim())
        );
        setParsedData({ headers, rows });
      } else {
        // TXT format - assume simple name list for customers
        if (type === 'customers') {
          const headers = ['name'];
          const rows = lines.map(line => [line.trim()]);
          setParsedData({ headers, rows });
        }
      }
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleColumnMapping = (csvColumn: string, fieldKey: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: csvColumn
    }));
  };

  const generatePreview = () => {
    if (!parsedData) return;

    const mapped = parsedData.rows.slice(0, 5).map(row => {
      const mappedRow: MappedData = {};
      Object.keys(columnMapping).forEach(fieldKey => {
        const csvColumn = columnMapping[fieldKey];
        const columnIndex = parsedData.headers.indexOf(csvColumn);
        if (columnIndex !== -1) {
          mappedRow[fieldKey] = row[columnIndex];
        }
      });
      return mappedRow;
    });

    setPreviewData(mapped);
    setStep(3);
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    try {
      const mappedData = parsedData.rows.map(row => {
        const mappedRow: MappedData = {};
        Object.keys(columnMapping).forEach(fieldKey => {
          const csvColumn = columnMapping[fieldKey];
          const columnIndex = parsedData.headers.indexOf(csvColumn);
          if (columnIndex !== -1) {
            mappedRow[fieldKey] = row[columnIndex];
          }
        });
        return mappedRow;
      });

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/import/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: mappedData,
          createBackup
        })
      });

      const results = await response.json();
      setImportResults(results);
      setStep(4);

      if (results.success > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setPreviewData([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Importer {type === 'customers' ? 'des clients' : 'des produits'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Sélectionner un fichier</p>
                <p className="text-gray-500">CSV ou TXT (max 10MB)</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="mt-4"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Format attendu:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(fields).map(([key, field]) => (
                  <li key={key}>
                    • {field.label} {field.required && <span className="text-red-500">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 2 && parsedData && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mapper les colonnes</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(fields).map(([fieldKey, field]) => (
                <div key={fieldKey} className="space-y-2">
                  <Label>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  <Select onValueChange={(value) => handleColumnMapping(value, fieldKey)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="backup"
                checked={createBackup}
                onCheckedChange={(checked) => setCreateBackup(checked === true)}
              />
              <Label htmlFor="backup">Créer une sauvegarde avant l'import</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline">
                Retour
              </Button>
              <Button onClick={generatePreview}>
                Aperçu
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Aperçu des données</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.entries(fields).map(([key, field]) => (
                      <th key={key} className="px-4 py-2 text-left">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-t">
                      {Object.keys(fields).map(fieldKey => (
                        <td key={fieldKey} className="px-4 py-2">
                          {row[fieldKey] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600">
              Aperçu des 5 premières lignes. Total: {parsedData?.rows.length} lignes
            </p>

            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline">
                Retour
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Import en cours...' : 'Importer'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && importResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Résultats de l'import</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {importResults.success} réussis
                  </span>
                </div>
              </div>

              {importResults.failed > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      {importResults.failed} échoués
                    </span>
                  </div>
                </div>
              )}
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Erreurs:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResults.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded">
                      Ligne {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}