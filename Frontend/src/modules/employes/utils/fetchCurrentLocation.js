const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 30000,
};

// Stop collecting samples once accuracy is this good (meters).
const TARGET_ACCURACY_METERS = 50;
// How long to keep refining before using the best sample we got.
const MAX_SAMPLE_MS = 15000;
// Reject if the best reading is still worse than this (meters).
const MAX_ACCEPTABLE_ACCURACY = 500;

const getGeolocationErrorMessage = (error) => {
  let errorMessage = "Unable to retrieve location: ";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage += "Please allow location access and enable Precise Location.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage += "Location information is unavailable. Enable GPS and try again.";
      break;
    case error.TIMEOUT:
      errorMessage += "Location request timed out. Move to an open area and try again.";
      break;
    default:
      errorMessage += error.message;
      break;
  }
  return errorMessage;
};

export const getHighAccuracyPosition = () =>
  new Promise((resolve, reject) => {
    let bestPosition = null;
    let watchId = null;
    let settled = false;

    const finish = (position, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(sampleTimer);
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (position) {
        resolve(position);
        return;
      }
      reject(error instanceof Error ? error : new Error(getGeolocationErrorMessage(error)));
    };

    const sampleTimer = setTimeout(() => {
      if (!bestPosition) {
        finish(
          null,
          new Error(
            "Unable to get location in time. Enable GPS, allow precise location, and try again.",
          ),
        );
        return;
      }

      const accuracy = Math.round(bestPosition.coords.accuracy);
      if (accuracy > MAX_ACCEPTABLE_ACCURACY) {
        finish(
          null,
          new Error(
            `Location accuracy is poor (~${accuracy}m). Enable GPS, go near a window or outdoors, and try again.`,
          ),
        );
        return;
      }

      finish(bestPosition);
    }, MAX_SAMPLE_MS);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { accuracy } = position.coords;

        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (accuracy <= TARGET_ACCURACY_METERS) {
          finish(position);
        }
      },
      (error) => {
        if (bestPosition) {
          finish(bestPosition);
          return;
        }
        finish(null, new Error(getGeolocationErrorMessage(error)));
      },
      GEOLOCATION_OPTIONS,
    );
  });

// Reverse geocode coordinates to get address
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return {
        formattedAddress: data.results[0].formatted_address,
        addressComponents: data.results[0].address_components,
      };
    } else {
      throw new Error("Unable to fetch address from coordinates");
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const fetchLocation = async () => {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser.");
  }

  const position = await getHighAccuracyPosition();
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const addressInfo = await reverseGeocode(latitude, longitude);

  return {
    latitude,
    longitude,
    address: addressInfo?.formattedAddress || "Address not available",
    addressDetails: addressInfo?.addressComponents || null,
    timestamp: position.timestamp,
    accuracy: position.coords.accuracy,
  };
};
