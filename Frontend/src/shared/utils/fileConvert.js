// Helper function - add this at top of your component file
export const base64ToBlob = (base64Url) => {
  const [meta, data] = base64Url.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const byteString = atob(data);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mime });
};