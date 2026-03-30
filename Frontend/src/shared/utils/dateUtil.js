

export const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date); // convert string to Date object
  const dateString = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  return dateString;
};