// verify if the checked In Location is within the radius of the office location
const verifyLocation = (lat, lng, workLocation) => {
  if (!workLocation) {
    return true; // If workLocation is not provided, allow check-in
  }
  const parsedWorkLocation =
    typeof workLocation === "string" ? JSON.parse(workLocation) : workLocation;
  const officeLat = parsedWorkLocation?.lat; //|| 18.93858048706659; // Example office latitude
  const officeLng = parsedWorkLocation?.lng; //|| 72.83484651433764; // Example office longitude
  const radius = 100; // Radius in meters

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const distance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lng2 - lng1);
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const dist = distance(lat, lng, officeLat, officeLng);
  return dist <= radius;
};
export { verifyLocation };
