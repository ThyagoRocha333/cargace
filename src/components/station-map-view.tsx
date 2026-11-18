"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type StationMarker = {
  id: number;
  latitude: number;
  longitude: number;
  name: string | null;
};
type Props = {
  stations: StationMarker[];
  selectedId: number | null;
  onSelect: (station: StationMarker) => void;
};

const markerIcon = L.divIcon({
  className: "cargace-map-marker",
  html: '<span class="cargace-map-marker-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FocusSelected({ station }: { station: StationMarker | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (station)
      map.flyTo(
        [station.latitude, station.longitude],
        Math.max(map.getZoom(), 15),
        { duration: 0.4 },
      );
  }, [map, station]);
  return null;
}

export default function StationMapView({
  stations,
  selectedId,
  onSelect,
}: Props) {
  const selected = stations.find((station) => station.id === selectedId);
  return (
    <MapContainer
      center={[-3.7319, -38.5267]}
      zoom={11}
      scrollWheelZoom
      className="leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FocusSelected station={selected} />
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={markerIcon}
          eventHandlers={{ click: () => onSelect(station) }}
          title={station.name ?? "Eletroposto"}
        />
      ))}
    </MapContainer>
  );
}
