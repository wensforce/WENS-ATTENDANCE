import React, { useState, useEffect } from "react";
import { Edit, LogOut, Settings} from "lucide-react";
import useAuth from "../../login/hooks/useAuth";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import { toast } from "react-toastify";

const Profile = () => {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(user);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { logout } = useAuth();

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setLogoutLoading(false);
      setLogoutConfirmOpen(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        {/* Profile Card */}
        <div className="bg-surface rounded-3xl border border-border p-8 mb-8 text-center">
          {/* Avatar */}
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center text-6xl">
            👨‍💼
          </div>

          {/* Name */}
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            {employeeData.employeeName}
          </h2>

          {/* Email */}
          <p className="text-text-secondary mb-4">{employeeData.email}</p>

          {/* Badge */}
          <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold text-sm">
            {employeeData.designation}
          </div>
        </div>

        {/* Employee Information Section */}
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-text-secondary mb-4 uppercase">
            Employee Information
          </h3>

          <div className="space-y-0 bg-surface rounded-2xl border border-border overflow-hidden">
            {/* EMP_CODE */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">EMP_CODE</span>
              <span className="text-text-primary font-semibold">
                {employeeData.employeeId}
              </span>
            </div>

            {/* Full Name */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">Full Name</span>
              <span className="text-text-primary font-semibold">
                {employeeData.employeeName}
              </span>
            </div>

            {/* Department */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">
                Department
              </span>
              <span className="text-text-primary font-semibold">
                {employeeData.department}
              </span>
            </div>

            {/* Joining Date */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">
                Joining Date
              </span>
              <span className="text-text-primary font-semibold">
                {formatDate(employeeData.createdAt)}
              </span>
            </div>

            {/* Designation */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">
                Designation
              </span>
              <span className="text-text-primary font-semibold">
                {employeeData.designation}
              </span>
            </div>

            {/* Shift */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">
                Shift
              </span>
              <span className="text-text-primary font-semibold">
                {employeeData.shift}
              </span>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <span className="text-text-secondary font-medium">
                Email
              </span>
              <span className="text-text-primary font-semibold text-sm">
                {employeeData.email}
              </span>
            </div>

            {/* Mobile Number */}
            <div className="flex justify-between items-center px-6 py-5">
              <span className="text-text-secondary font-medium">
                Mobile Number
              </span>
              <span className="text-text-primary font-semibold">
                {employeeData.mobileNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          {/* Edit Profile Button */}
          {/*Coming Soon. The Edit Profile button is currently commented out as the edit functionality is not implemented yet. */}
          {/* <button className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border text-text-primary py-4 rounded-full font-semibold hover:bg-gray-50 transition">
            <Edit size={20} />
            Edit Profile
          </button> */}

          {/* LOGOUT Button */}
          <button onClick={handleLogoutClick} className="flex-1 flex items-center justify-center gap-2 bg-primary border border-border text-primary-foreground py-4 rounded-full font-semibold hover:bg-gray-50 transition">
            <LogOut size={20} />
            LOGOUT
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to log in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={true}
        loading={logoutLoading}
      />
    </div>
  );
};

export default Profile;
