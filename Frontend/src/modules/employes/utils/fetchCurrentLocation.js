const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

export const fetchLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
    } else {
      // getCurrentPosition will prompt user every time if permission was denied
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Get address from coordinates using Google Maps API
          const addressInfo = await reverseGeocode(latitude, longitude);

          resolve({
            latitude,
            longitude,
            address: addressInfo?.formattedAddress || "Address not available",
            addressDetails: addressInfo?.addressComponents || null,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          // This will be called each time user denies permission
          let errorMessage = "Unable to retrieve location: ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "The request to get user location timed out.";
              break;
            default:
              errorMessage += error.message;
              break;
          }
          reject(new Error(errorMessage));
        },
      );
    }
  });
};
