import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

function BasicMap({ locations, selectedLocation }) {
  const mapRef = useRef(null);
  const defaultCenter = [27.7172, 85.3240]; // Default center (Kathmandu)

  // Create default icon
  const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41]
  });

  // Pan to selected location
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.setView(
        [selectedLocation.latitude, selectedLocation.longitude],
        15
      );
    }
  }, [selectedLocation]);

  return (
    <MapContainer 
      ref={mapRef}
      center={defaultCenter} 
      zoom={13} 
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {locations.map((location) => (
        <Marker 
          key={location.id} 
          position={[location.latitude, location.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div>
              <h3>{location.region}</h3>
              <p>Address: {location.address}</p>
              <p>Postcode: {location.postcode}</p>
              <p>Coordinates: {location.latitude}, {location.longitude}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default BasicMap;