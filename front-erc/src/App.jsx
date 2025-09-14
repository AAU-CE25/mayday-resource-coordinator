
import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

function App() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
        projection: 'EPSG:3857',
      }),
    });
    return () => map.setTarget(undefined);
  }, []);

  return (
    <div>
      <h1>OpenLayers Map Example</h1>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}

export default App;
