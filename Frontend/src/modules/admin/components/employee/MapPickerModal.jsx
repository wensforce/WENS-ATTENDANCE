import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Loader2, Search, MapPin, Navigation } from "lucide-react";
import useDebounce from "../../../../shared/hooks/useDebounce.js";
import {
  loadGoogleMaps,
  GOOGLE_MAPS_MAP_ID,
} from "../../../../shared/utils/googleMaps.js";
import { getHighAccuracyPosition } from "../../../employes/utils/fetchCurrentLocation.js";

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

const MapPickerModal = ({ open, onClose, onConfirm, loading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    lat: "",
    lng: "",
    address: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mapError, setMapError] = useState("");

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const geocoder = useRef(null);
  const placesLib = useRef(null);
  const sessionToken = useRef(null);
  // Suppresses the autocomplete lookup that a programmatic input update triggers.
  const skipNextLookup = useRef(false);

  const debouncedQuery = useDebounce(searchQuery, 400);

  const placeMarker = useCallback((lat, lng) => {
    if (!map.current) return;
    const position = { lat, lng };

    if (marker.current) {
      marker.current.position = position;
    } else {
      marker.current = new window.google.maps.marker.AdvancedMarkerElement({
        map: map.current,
        position,
      });
    }
    map.current.panTo(position);
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (!geocoder.current) return fallback;

    try {
      const { results } = await geocoder.current.geocode({
        location: { lat, lng },
      });
      return results?.[0]?.formatted_address || fallback;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return fallback;
    }
  }, []);

  const selectCoordinates = useCallback(
    async (lat, lng) => {
      setSelectedLocation({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address: "",
      });
      placeMarker(lat, lng);
      const address = await reverseGeocode(lat, lng);
      setSelectedLocation((prev) => ({ ...prev, address }));
    },
    [placeMarker, reverseGeocode],
  );

  // Initialise the Google map when the modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const initMap = async () => {
      await loadGoogleMaps();
      if (cancelled || !mapContainer.current) return;

      const [{ Map }] = await Promise.all([
        window.google.maps.importLibrary("maps"),
        window.google.maps.importLibrary("marker"),
      ]);
      placesLib.current = await window.google.maps.importLibrary("places");
      if (cancelled || !mapContainer.current) return;

      map.current = new Map(mapContainer.current, {
        center: INDIA_CENTER,
        zoom: 5,
        mapId: GOOGLE_MAPS_MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      geocoder.current = new window.google.maps.Geocoder();

      map.current.addListener("click", (e) => {
        selectCoordinates(e.latLng.lat(), e.latLng.lng());
      });
    };

    initMap().catch((err) => {
      console.error("Failed to load map:", err);
      if (!cancelled) {
        setMapError(
          `Unable to load Google Maps: ${err?.message || err}. Check the API key and enabled APIs.`,
        );
      }
    });

    return () => {
      cancelled = true;
      if (marker.current) marker.current.map = null;
      marker.current = null;
      map.current = null;
      geocoder.current = null;
      placesLib.current = null;
      sessionToken.current = null;
    };
  }, [open, selectCoordinates]);

  // Reset transient state each time the modal opens
  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setSuggestions([]);
    setMapError("");
    setSelectedLocation({ lat: "", lng: "", address: "" });
  }, [open]);

  // Autocomplete lookup as the user types
  useEffect(() => {
    if (skipNextLookup.current) {
      skipNextLookup.current = false;
      return;
    }

    const query = debouncedQuery.trim();
    if (!open || query.length < 3 || !placesLib.current) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      const { AutocompleteSessionToken, AutocompleteSuggestion } =
        placesLib.current;

      if (!sessionToken.current) {
        sessionToken.current = new AutocompleteSessionToken();
      }

      setIsSearching(true);
      try {
        const { suggestions: results } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            sessionToken: sessionToken.current,
            region: "in",
          });
        if (!cancelled) setSuggestions(results.slice(0, 5));
      } catch (error) {
        console.error("Autocomplete failed:", error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const selectSuggestion = async (suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    setSuggestions([]);
    skipNextLookup.current = true;
    setSearchQuery(prediction.text?.text || "");

    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["location", "formattedAddress", "displayName"],
      });
      // A session ends once a place is fetched from one of its predictions.
      sessionToken.current = null;

      const lat = place.location.lat();
      const lng = place.location.lng();

      setSelectedLocation({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address:
          place.formattedAddress || place.displayName || prediction.text?.text,
      });
      placeMarker(lat, lng);
      map.current?.setZoom(16);
    } catch (error) {
      console.error("Failed to fetch place details:", error);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLocationLoading(true);
    try {
      const position = await getHighAccuracyPosition();
      const { latitude, longitude } = position.coords;
      await selectCoordinates(latitude, longitude);
      map.current?.setZoom(16);
    } catch (error) {
      console.error("Geolocation error:", error);
      alert(error.message || "Failed to get current location");
    } finally {
      setLocationLoading(false);
    }
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
      {/* scroll bar hide css in tailwind */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-y-scroll scrollbar-none bg-surface [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary focus:ring-2 focus:ring-black/8"
              />
              {isSearching && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
                />
              )}
            </div>
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

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              {suggestions.map((suggestion, idx) => {
                const prediction = suggestion.placePrediction;
                return (
                  <button
                    key={prediction?.placeId || idx}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={12}
                        className="text-text-muted mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {prediction?.mainText?.text || prediction?.text?.text}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {prediction?.secondaryText?.text ||
                            prediction?.text?.text}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mapError && <p className="text-xs text-absent-text">{mapError}</p>}
        </div>

        {/* Map Container */}
        <div
          ref={mapContainer}
          className="flex-1 bg-background rounded-none"
          style={{ minHeight: "350px" }}
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
        <div className="flex items-center rounded-2xl justify-end gap-3 px-6 py-4 shrink-0 border-t border-border bg-background">
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
