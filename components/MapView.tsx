
import React, { useEffect, useRef } from 'react';
import { GraveRecord } from '../types';

interface MapViewProps {
  records: GraveRecord[];
}

const MapView: React.FC<MapViewProps> = ({ records }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore (Leaflet est chargé via CDN dans index.html)
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    // Initialisation de la carte si elle n'existe pas
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false // On le placera manuellement pour le design
      }).setView([46.603354, 1.888334], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Correction CRUCIALE pour l'écran blanc :
      // On attend que le DOM soit bien prêt avant de forcer le rendu
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);

      // Géolocalisation
      mapRef.current.locate({ setView: true, maxZoom: 16 });

      mapRef.current.on('locationfound', (e: any) => {
        if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.circleMarker(e.latlng, {
          radius: 8,
          fillColor: "#3b82f6",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapRef.current).bindPopup("Vous êtes ici");
      });
      
      mapRef.current.on('locationerror', () => {
        console.warn("La géolocalisation a échoué.");
      });
    }

    // Mise à jour des marqueurs
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];

    const recordsWithCoords = records.filter(r => r.lat && r.lng);
    if (recordsWithCoords.length > 0) {
      const bounds = L.latLngBounds([]);
      
      recordsWithCoords.forEach(record => {
        const marker = L.marker([record.lat, record.lng]).addTo(mapRef.current);
        const names = record.people.map(p => p.name || 'Anonyme').join(', ');
        
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 140px;">
            <div style="font-weight: 900; color: #2563eb; font-size: 10px; text-transform: uppercase; margin-bottom: 4px;">Stèle N°${record.steleNumber}</div>
            <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${names}</div>
            <img src="${record.photoUrl}" style="width: 100%; h-auto; border-radius: 8px; margin-bottom: 4px;" />
            <div style="font-size: 9px; color: #94a3b8;">Allée: ${record.aisleNumber || '?'}</div>
          </div>
        `);
        markersRef.current.push(marker);
        bounds.extend([record.lat!, record.lng!]);
      });

      // Si on a plusieurs stèles, on centre sur le groupe
      if (recordsWithCoords.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      // On ne détruit pas la carte ici pour permettre la persistance lors du retour d'onglets
    };
  }, [records]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner relative">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />
        <div className="absolute top-4 left-4 z-[1000]">
           <button 
             onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 18 })}
             className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 active:scale-90 transition flex items-center justify-center"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export default MapView;
