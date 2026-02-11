
import React from 'react';
import { Trash2, Calendar, User, Quote, Users, MapPin, Edit3, Grid3X3, ShieldAlert } from 'lucide-react';
import { GraveRecord } from '../types';

interface RecordListProps {
  records: GraveRecord[];
  onDelete: (id: string) => void;
  onEdit: (record: GraveRecord) => void;
}

const RecordList: React.FC<RecordListProps> = ({ records, onDelete, onEdit }) => {
  const getConditionColor = (cond: string) => {
    if (cond.includes('bon')) return 'text-green-600 bg-green-50';
    if (cond.includes('Moyen')) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid gap-8 pb-24">
      {records.map(record => (
        <div 
          key={record.id} 
          className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col sm:flex-row relative"
        >
          {/* Main ID Badge */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg">
              STÈLE N°{record.steleNumber}
            </div>
            {record.aisleNumber && (
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg">
                <Grid3X3 className="w-3 h-3" /> ALLÉE {record.aisleNumber}
              </div>
            )}
          </div>

          <div className="sm:w-48 h-64 sm:h-auto shrink-0 relative bg-slate-100 overflow-hidden">
            <img src={record.photoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Stèle ${record.steleNumber}`} />
            <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 backdrop-blur-md border border-white/30 ${getConditionColor(record.condition)}`}>
               <ShieldAlert className="w-3 h-3" /> {record.condition}
            </div>
          </div>

          <div className="flex-1 p-7 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {record.lat ? `${record.lat.toFixed(5)}, ${record.lng?.toFixed(5)}` : 'SANS GPS'}
                </div>
                <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Capturé {new Date(record.timestamp).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(record)} className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 transition border border-slate-100 shadow-sm"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(record.id)} className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition border border-slate-100 shadow-sm"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-6">
              {record.people.map((person, idx) => (
                <div key={idx} className={`${idx > 0 ? 'pt-4 border-t border-slate-50' : ''}`}>
                  <h3 className="font-black text-slate-800 text-base flex items-center gap-2 uppercase tracking-tight">
                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                    {person.name || 'ANONYME'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-[10px] font-bold text-slate-500">
                       <span className="block text-[8px] uppercase text-slate-300 tracking-widest">Né(e)</span>
                       {person.birthDate || '?'} {person.birthPlace && <span className="text-slate-400 font-medium">({person.birthPlace})</span>}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                       <span className="block text-[8px] uppercase text-slate-300 tracking-widest">Décédé(e)</span>
                       {person.deathDate || '?'} {person.deathPlace && <span className="text-slate-400 font-medium">({person.deathPlace})</span>}
                    </div>
                  </div>
                  {person.epitaph && (
                    <div className="mt-4 bg-blue-50/50 p-3 rounded-2xl italic text-[11px] text-slate-600 flex gap-3 border border-blue-50 leading-relaxed shadow-inner">
                      <Quote className="w-3.5 h-3.5 shrink-0 text-blue-200 mt-1" />
                      <p className="line-clamp-2">{person.epitaph}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${record.isSynced ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {record.isSynced ? "SYNC OK" : "LOCAL"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecordList;
