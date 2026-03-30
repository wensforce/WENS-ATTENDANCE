import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { HelpCircle } from "lucide-react";
import wensLogo from "/icons/logo.png";

const Login = () => {
  const [emailOrMobileNumber, setEmailOrMobileNumber] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const pinRef = useRef([]);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      pinRef.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrMobileNumber || pin.some((p) => p === "")) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    const email = emailOrMobileNumber.includes("@")
      ? emailOrMobileNumber
      : null;
    const mobileNumber = /^\d{10}$/.test(emailOrMobileNumber)
      ? emailOrMobileNumber
      : null;
    if (!email && !mobileNumber) {
      setError("Please enter a valid email or mobile number");
      return;
    }
    const password = pin.join("");
    try {
      const result = await login(email, mobileNumber, password);
      
      setLoading(false);
      if (result.error) {
        return setError(result.message || "Something went wrong");
      }
      if (result.data.user.userType === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (
        result.data.user.userType === "BODYGUARD" ||
        result.data.user.userType === "EMPLOYE"
      ) {
        navigate("/");
      }
    } catch (error) {
      
      setError(
        "Failed to log in. Please check your credentials and try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Help Icon */}
        <div className="absolute top-6 right-6">
          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition">
            <HelpCircle size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* WENS Logo */}
        <div className="my-6">
          <img
            src={wensLogo}
            alt="WENS Force Logo"
            className="h-32 w-32 object-contain"
          />
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-text-secondary">
            Sign in to continue to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email/Phone Input */}
          <div>
            <label className="block text-text-primary text-base font-semibold mb-3">
              Email or Phone Number
            </label>
            <input
              type="text"
              value={emailOrMobileNumber}
              onChange={(e) => setEmailOrMobileNumber(e.target.value)}
              placeholder="e.g. name@company.com"
              className="w-full px-5 py-4 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted bg-surface text-text-primary transition"
              required
            />
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-text-primary text-base font-semibold mb-3">
              4-Digit PIN
            </label>
            <div className="flex gap-4 justify-between">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (pinRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="w-16 h-16 text-center text-2xl font-semibold border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-black/10 transition bg-surface text-text-primary"
                />
              ))}
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-full hover:opacity-80 transition disabled:bg-gray-600 flex items-center justify-center gap-2"
          >
            Login <span className="text-xl">→</span>
          </button>
        </form>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <p className="text-text-secondary text-sm font-medium mb-2">
            Having trouble logging in?
          </p>
          <button className="text-primary font-bold underline hover:opacity-70 transition">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
