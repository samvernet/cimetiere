
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, X, Check, Loader2, AlertCircle, Image as ImageIcon, UserPlus, UserMinus, MapPin, Search } from 'lucide-react';
import { transcribeGravePhoto } from '../services/geminiService.ts';
import { GraveRecord, TranscriptionResult, Person, SteleCondition } from '../types.ts';

interface CameraViewProps {
  onCancel: () => void;
  onSave: (record: Omit<GraveRecord, 'steleNumber'>) => void;
  isOnline: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCancel, onSave, isOnline }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult>({ people: [] });
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat?: number, lng?: number}>({});
  
  // Manual fields
  const [aisle, setAisle] = useState('');
  const [condition, setCondition] = useState<SteleCondition>('Bon');

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const fetchGPS = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS error", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Caméra bloquée.");
      }
    }
    startCamera();
    fetchGPS();
    return () => stopStream();
  }, [fetchGPS, stopStream]);

  const handleImageSelected = (dataUrl: string) => {
    setCapturedImage(dataUrl);
    stopStream();
    fetchGPS();
    if (isOnline) {
      processImage(dataUrl);
    } else {
      setTranscription({ people: [{ name: '', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', epitaph: '' }] });
    }
  };

  const processImage = async (image: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await transcribeGravePhoto(image);
      setTranscription(result);
    } catch (err) {
      setError("Transcription échouée.");
      setTranscription({ people: [{ name: '', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', epitaph: '' }] });
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePerson = (index: number, field: keyof Person, value: string) => {
    setTranscription(prev => ({
      people: prev.people.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const handleSave = () => {
    if (!capturedImage) return;
    onSave({
      id: crypto.randomUUID(),
      photoUrl: capturedImage,
      aisleNumber: aisle,
      condition: condition,
      people: transcription.people,
      timestamp: Date.now(),
      isSynced: false,
      lat: coords.lat,
      lng: coords.lng
    });
  };

  const conditions: SteleCondition[] = ['Très bon', 'Bon', 'Moyen', 'Mauvais', 'Très mauvais'];

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans text-slate-900">
      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            {stream ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" /> : null}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const r = new FileReader();
                r.onload = (ev) => handleImageSelected(ev.target?.result as string);
                r.readAsDataURL(file);
              }
            }} />
            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8 px-8">
              <button onClick={onCancel} className="bg-white/10 p-4 rounded-full text-white backdrop-blur-md">
                <X className="w-6 h-6" />
              </button>
              <button onClick={() => {
                if (videoRef.current && canvasRef.current) {
                  const canvas = canvasRef.current;
                  canvas.width = videoRef.current.videoWidth;
                  canvas.height = videoRef.current.videoHeight;
                  canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                  handleImageSelected(canvas.toDataURL('image/jpeg'));
                }
              }} disabled={!stream} className="bg-white w-24 h-24 rounded-full border-[6px] border-slate-300 shadow-2xl active:scale-95 transition flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-slate-900"></div>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white/10 p-4 rounded-full text-white backdrop-blur-md">
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full relative flex flex-col bg-white">
            <div className="h-1/4 bg-slate-800 shrink-0 relative">
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">
                   {coords.lat ? `X: ${coords.lat.toFixed(4)} Y: ${coords.lng?.toFixed(4)}` : 'GPS OFF'}
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 rounded-t-[40px] -mt-8 bg-white overflow-y-auto shadow-2xl">
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Numéro d'allée</label>
                    <input 
                      type="text" 
                      value={aisle} 
                      onChange={e => setAisle(e.target.value)} 
                      placeholder="Ex: A-12"
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold bg-slate-50"
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">État Global</label>
                    <select 
                      value={condition} 
                      onChange={e => setCondition(e.target.value as SteleCondition)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold bg-slate-50 outline-none"
                    >
                      {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
               </div>

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <p className="text-slate-800 font-black text-sm uppercase tracking-widest">IA en action...</p>
                </div>
              ) : (
                <div className="space-y-6 text-slate-900">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Défunt(s) ({transcription.people.length})</h3>
                    <button onClick={() => setTranscription(prev => ({ people: [...prev.people, { name: '', birthDate: '', birthPlace: '', deathDate: '', deathPlace: '', epitaph: '' }] }))} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">+ AJOUTER</button>
                  </div>

                  {transcription.people.map((person, index) => (
                    <div key={index} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4 relative">
                      {transcription.people.length > 1 && (
                        <button onClick={() => setTranscription(prev => ({ people: prev.people.filter((_, i) => i !== index) }))} className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow border border-slate-100"><X className="w-3 h-3"/></button>
                      )}
                      <InputField label="Nom Complet" value={person.name} onChange={(v) => updatePerson(index, 'name', v)} />
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Né(e) le" value={person.birthDate} onChange={(v) => updatePerson(index, 'birthDate', v)} />
                        <InputField label="Lieu N. (CP)" value={person.birthPlace} onChange={(v) => updatePerson(index, 'birthPlace', v)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Décédé(e) le" value={person.deathDate} onChange={(v) => updatePerson(index, 'deathDate', v)} />
                        <InputField label="Lieu D. (CP)" value={person.deathPlace} onChange={(v) => updatePerson(index, 'deathPlace', v)} />
                      </div>
                      <label className="block">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Épitaphe</span>
                        <textarea className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" value={person.epitaph} onChange={(e) => updatePerson(index, 'epitaph', e.target.value)} />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-10 pb-12">
                <button onClick={() => setCapturedImage(null)} className="flex-1 bg-slate-100 text-slate-600 font-black text-[10px] uppercase py-5 rounded-2xl hover:bg-slate-200">Reprendre</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-black text-[10px] uppercase py-5 rounded-2xl shadow-xl shadow-blue-100">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const InputField: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block mb-1">{label}</span>
    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 text-slate-900" value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export default CameraView;
