import React, { useState, useEffect } from 'react';
import { Camera, List, Plus, Download, CloudSync, Map as MapIcon, Table, Loader2, Settings, X as CloseIcon, Link as LinkIcon } from 'lucide-react';
import { GraveRecord, ViewMode, SteleCondition } from './types.ts';
import CameraView from './components/CameraView.tsx';
import RecordList from './components/RecordList.tsx';
import MapView from './components/MapView.tsx';

const STORAGE_KEY = 'grave_records_local';
const COUNTER_KEY = 'grave_stele_counter';
const WEBHOOK_KEY = 'grave_webhook_url';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.LIST);
  const [records, setRecords] = useState<GraveRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingRecord, setEditingRecord] = useState<GraveRecord | null>(null);
  const [isSheetSyncing, setIsSheetSyncing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem(WEBHOOK_KEY) || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRecords(JSON.parse(saved));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(WEBHOOK_KEY, webhookUrl);
  }, [webhookUrl]);

  const getNextSteleNumber = () => {
    const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0');
    const next = current + 1;
    localStorage.setItem(COUNTER_KEY, next.toString());
    return next;
  };

  const addRecord = (newRecord: Omit<GraveRecord, 'steleNumber'>) => {
    const recordWithNumber: GraveRecord = {
      ...newRecord,
      steleNumber: getNextSteleNumber()
    };
    setRecords(prev => [recordWithNumber, ...prev]);
    setView(ViewMode.LIST);
  };

  const updateRecord = (updated: GraveRecord) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingRecord(null);
  };

  const deleteRecord = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const syncToGoogleSheet = async () => {
    if (!isOnline) {
      alert("Vous devez être en ligne pour synchroniser.");
      return;
    }
    if (!webhookUrl) {
      alert("Veuillez configurer l'URL du Webhook dans les paramètres (icône roue dentée).");
      setIsSettingsOpen(true);
      return;
    }

    const unsynced = records.filter(r => !r.isSynced);
    if (unsynced.length === 0) {
      alert("Toutes les données sont déjà synchronisées.");
      return;
    }
    
    setIsSheetSyncing(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ data: unsynced })
      });

      setRecords(prev => prev.map(r => ({ ...r, isSynced: true })));
      alert(`${unsynced.length} stèle(s) synchronisée(s) !`);
    } catch (e) {
      console.error(e);
      alert("Échec du transfert. Vérifiez l'URL du script Google et le déploiement 'Tout le monde'.");
    } finally {
      setIsSheetSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto shadow-xl bg-white border-x border-slate-200 overflow-hidden">
      <header className="bg-slate-900 text-white p-4 shrink-0 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-400" />
            Mémoire Géo-IA
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Transcription & GPS & Sheet</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition relative">
            <Settings className="w-5 h-5 text-slate-300" />
            {!webhookUrl && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>}
          </button>
          <div className="flex flex-col items-end">
             <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[8px] font-black uppercase mt-1">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-slate-50 relative flex flex-col">
        {view === ViewMode.LIST && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Registre ({records.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => {
                  const headers = ['N° Stèle', 'Allée', 'État', 'X', 'Y', 'Nom', 'Naissance', 'Décès', 'Épitaphe'];
                  const csv = [headers.join(','), ...records.flatMap(r => r.people.map(p => [r.steleNumber, r.aisleNumber, r.condition, r.lat, r.lng, p.name, p.birthDate, p.deathDate, `"${p.epitaph}"`].join(',')))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'registre.csv'; a.click();
                }} className="flex items-center gap-2 text-[10px] bg-white border border-slate-200 px-3 py-2 rounded-full text-slate-700 font-black shadow-sm">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button 
                  onClick={syncToGoogleSheet}
                  disabled={isSheetSyncing}
                  className="flex items-center gap-2 text-[10px] bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-full text-white font-black shadow-lg disabled:opacity-50"
                >
                  {isSheetSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                  TRANSFERT SHEET
                </button>
              </div>
            </div>
            <RecordList records={records} onDelete={deleteRecord} onEdit={(r) => setEditingRecord(r)} />
          </div>
        )}

        {view === ViewMode.MAP && (
          <div className="flex-1 min-h-[400px]">
            <MapView records={records} />
          </div>
        )}

        {view === ViewMode.CAPTURE && <CameraView onCancel={() => setView(ViewMode.LIST)} onSave={addRecord} isOnline={isOnline} />}

        {/* Modal Paramètres Webhook */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Destination Script</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)}><CloseIcon className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    L'URL de votre Google Apps Script (déployé en Web App) est nécessaire pour l'envoi des données.
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL Google Apps Script</label>
                  <input 
                    type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} 
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-sm font-mono outline-none"
                  />
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {editingRecord && (
          <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Édition Stèle N°{editingRecord.steleNumber}</h3>
                <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 font-bold">Fermer</button>
              </div>
              <div className="p-6 overflow-y-auto bg-slate-50/30">
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Stèle N°</label>
                        <input type="number" value={editingRecord.steleNumber} className="w-full p-2 border rounded-lg" onChange={e => setEditingRecord({...editingRecord, steleNumber: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Allée</label>
                        <input type="text" value={editingRecord.aisleNumber || ''} className="w-full p-2 border rounded-lg" onChange={e => setEditingRecord({...editingRecord, aisleNumber: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  {editingRecord.people.map((p, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
                      <input type="text" value={p.name} className="w-full p-2 border rounded-xl font-bold" placeholder="Nom" onChange={e => {
                        const people = [...editingRecord.people]; people[idx].name = e.target.value; setEditingRecord({...editingRecord, people});
                      }} />
                      <div className="grid grid-cols-2 gap-3">
                         <input type="text" value={p.birthDate} className="w-full p-2 border rounded-lg text-xs" placeholder="Naissance" onChange={e => {
                           const people = [...editingRecord.people]; people[idx].birthDate = e.target.value; setEditingRecord({...editingRecord, people});
                         }} />
                         <input type="text" value={p.deathDate} className="w-full p-2 border rounded-lg text-xs" placeholder="Décès" onChange={e => {
                           const people = [...editingRecord.people]; people[idx].deathDate = e.target.value; setEditingRecord({...editingRecord, people});
                         }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white border-t flex gap-3">
                <button onClick={() => setEditingRecord(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Annuler</button>
                <button onClick={() => updateRecord(editingRecord)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Sauver</button>
              </div>
            </div>
          </div>
        )}
      </main>

 {/* BARRE DE NAVIGATION CORRIGÉE */}
      <nav className="bg-white border-t border-slate-200 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 25px)' }}>
        <div className="flex justify-around items-center p-4">
          <button onClick={() => setView(ViewMode.LIST)} className={`flex flex-col items-center gap-1 transition ${view === ViewMode.LIST ? 'text-blue-600' : 'text-slate-400'}`}>
            <List className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase">Liste</span>
          </button>
          
          <button onClick={() => setView(ViewMode.MAP)} className={`flex flex-col items-center gap-1 transition ${view === ViewMode.MAP ? 'text-blue-600' : 'text-slate-400'}`}>
            <MapIcon className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase">Carte</span>
          </button>
          
          <button onClick={() => setView(ViewMode.CAPTURE)} className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition border-4 border-white -translate-y-4">
            <Plus className="w-8 h-8" />
          </button>

          <button className="flex flex-col items-center gap-1 text-slate-300">
            <CloudSync className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase">Sync</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
