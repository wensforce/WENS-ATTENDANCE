export const getHomePath = (user) => {
  if (user?.userType === "SUPERADMIN") return "/platform/tenants";
  if (user?.userType === "ADMIN") return "/admin/dashboard";
  return "/";
};
