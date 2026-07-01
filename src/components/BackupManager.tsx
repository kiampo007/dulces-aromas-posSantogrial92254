import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, HardDrive, Check } from 'lucide-react';
import { toast } from 'sonner';

const KEYS = [
  'dulces_aromas_products',
  'dulces_aromas_sales',
  'dulces_aromas_debts',
  'dulces_aromas_clients',
  'dulces_aromas_creditos',
  'dulces_aromas_meta_mes',
  'dulces_aromas_config',
  'dulces_aromas_pin-hash',
];

export default function BackupManager() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  const exportar = () => {
    const backup: Record<string, any> = {};
    KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });
    
    const data = {
      version: '1.0',
      fecha: new Date().toISOString(),
      app: 'Dulces Aromas POS',
      data: backup,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dulces-aromas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    setLastBackup(new Date().toLocaleString('es-CL'));
    toast.success('Backup descargado correctamente');
  };
  
  const importar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        
        if (!backup.data) {
          toast.error('Archivo de backup inválido');
          return;
        }
        
        if (!confirm(`¿Importar backup del ${new Date(backup.fecha).toLocaleDateString('es-CL')}? Esto reemplazará todos los datos actuales.`)) {
          return;
        }
        
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        
        toast.success('Backup importado. Recarga la página para ver los cambios.');
      } catch {
        toast.error('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
  };
  
  const tamanoDatos = () => {
    let total = 0;
    KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) total += value.length * 2;
    });
    return (total / 1024).toFixed(1);
  };
  
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-cyan-400" />
          Backup y Restauración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
          <span className="text-sm text-muted-foreground">Tamaño de datos</span>
          <span className="text-sm font-medium">{tamanoDatos()} KB</span>
        </div>
        
        {lastBackup && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Check className="h-3 w-3" />
            Último backup: {lastBackup}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={exportar} className="flex-1" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <label className="flex-1">
            <input type="file" accept=".json" onChange={importar} className="hidden" />
            <div className="w-full h-10 flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
              <Upload className="h-4 w-4" />
              Importar
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
