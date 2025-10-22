import React, { useState, useEffect } from 'react';
import BasicMap from './maps/BasicMap';

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fetch function exposed so you can call it again after adding a location
  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/locations/');
      if (!response.ok) {
        console.error('Failed to fetch locations:', response.statusText);
        setLocations([]);
        return;
      }
      const data = await response.json();
      console.log('fetched locations:', data); // debug
      setLocations(data);
      if (data.length > 0 && !selectedLocation) {
        setSelectedLocation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchLocations();

    // Optional: simple polling to auto-refresh every 10s (uncomment if desired)
    // const id = setInterval(fetchLocations, 10000);
    // return () => clearInterval(id);
  }, []);

  const handleLocationSelect = (event) => {
    const id = parseInt(event.target.value, 10);
    const location = locations.find(loc => loc.id === id);
    setSelectedLocation(location || null);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region: selectedLocation.region,
          address: selectedLocation.address,
          postcode: selectedLocation.postcode,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save location');
      }

      // After successful save, refresh the locations
      await fetchLocations();
      alert('Location saved successfully!');
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location');
    }
  };

  return (
    <div>
      <h1>Location Map</h1>

      <div style={{ marginBottom: '12px' }}>
        <button onClick={fetchLocations} style={{ marginRight: 8 }}>
          Refresh locations
        </button>
        <button
          onClick={handleSaveLocation}
          disabled={!selectedLocation}
          style={{
            marginRight: 8,
            padding: '8px 16px',
            backgroundColor: selectedLocation ? '#4CAF50' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedLocation ? 'pointer' : 'not-allowed'
          }}
        >
          Save Location
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <select
          onChange={handleLocationSelect}
          value={selectedLocation?.id || ''}
          style={{ padding: '8px', fontSize: '16px' }}
        >
          <option value="">Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.region} - {location.address}
            </option>
          ))}
        </select>
      </div>

      <BasicMap locations={locations} selectedLocation={selectedLocation} />
    </div>
  );
}

export default App;