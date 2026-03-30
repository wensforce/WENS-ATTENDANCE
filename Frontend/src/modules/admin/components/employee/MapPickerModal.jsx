import React, { useEffect, useState, useRef } from "react";
import { X, Loader2, Search, MapPin, Navigation } from "lucide-react";

const MapPickerModal = ({ open, onClose, onConfirm, loading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    lat: "",
    lng: "",
    address: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Initialize Leaflet map dynamically when modal opens
  useEffect(() => {
    if (!open || !mapContainer.current) return;

    const initMap = async () => {
      // Dynamically import Leaflet and its CSS
      const leafletModule = await import("leaflet");
      const L = leafletModule.default;
      await import("leaflet/dist/leaflet.css");

      // Create map
      map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5); // India center

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map.current);

      // Handle map click
      map.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation((prev) => ({
          ...prev,
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
        }));
        updateMarker(lat, lng, L);
        reverseGeocode(lat, lng);
      });
    };

    initMap().catch((err) => console.error("Failed to load map:", err));

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [open]);

  const updateMarker = (lat, lng, L) => {
    if (!map.current) return;

    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    marker.current = L.marker([lat, lng]).addTo(map.current);
    map.current.panTo([lat, lng]); // Pan without changing zoom level
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setSelectedLocation((prev) => ({
        ...prev,
        address: data.address?.country || `${lat}, ${lng}`,
      }));
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSelectedLocation((prev) => ({
        ...prev,
        address: `${lat}, ${lng}`,
      }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const results = await response.json();
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = async (result) => {
    const lat = parseFloat(result.lat).toFixed(6);
    const lng = parseFloat(result.lon).toFixed(6);

    setSelectedLocation({
      lat,
      lng,
      address: result.display_name || result.name,
    });

    // Update map
    const leafletModule = await import("leaflet");
    const L = leafletModule.default;
    updateMarker(parseFloat(result.lat), parseFloat(result.lon), L);
    setSearchResults([]);
    setSearchQuery("");
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const lat = latitude.toFixed(6);
        const lng = longitude.toFixed(6);

        setSelectedLocation({
          lat,
          lng,
          address: "",
        });

        const leafletModule = await import("leaflet");
        const L = leafletModule.default;
        updateMarker(latitude, longitude, L);
        await reverseGeocode(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get current location");
        setLocationLoading(false);
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedLocation.lat || !selectedLocation.lng) {
      alert("Please select a location on the map");
      return;
    }
    onConfirm(selectedLocation);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-surface">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Select Work Location
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Search or click on the map to select a location
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-background hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-3 shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSearching && <Loader2 size={13} className="animate-spin" />}
              Search
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={locationLoading}
              title="Use current location"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {locationLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Navigation size={13} />
              )}
              Current
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSearchResult(result)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-surface transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {result.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {result.display_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div
          ref={mapContainer}
          className="flex-1 bg-background rounded-none"
          style={{ minHeight: "400px" }}
        />

        {/* Selected Location Info */}
        {selectedLocation.lat && selectedLocation.lng && (
          <div className="px-6 py-3 shrink-0 bg-background border-t border-border">
            <div className="space-y-1">
              {selectedLocation.address && (
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold">Address:</span>{" "}
                  {selectedLocation.address}
                </p>
              )}
              <p className="text-xs text-text-muted">
                <span className="font-semibold">Coordinates:</span>{" "}
                {selectedLocation.lat}, {selectedLocation.lng}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-border bg-background">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-background transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedLocation.lat || !selectedLocation.lng}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.opacity = "1")
            }
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
