import { useState } from "react";

const DataDeletionRequest = () => {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    employeeId: false,
    contact: false,
    confirmDelete: false,
  });
  const [showEmailNote, setShowEmailNote] = useState(false);

  const trimmedName = name.trim();
  const trimmedEmployeeId = employeeId.trim();
  const trimmedContact = contact.trim();

  const errors = {
    name: !trimmedName ? "Full Name is required." : "",
    employeeId: !trimmedEmployeeId ? "Employee ID is required." : "",
    contact: !trimmedContact
      ? "Registered Email or Phone is required."
      : "",
    confirmDelete: !confirmDelete
      ? "You must confirm permanent deletion before sending the request."
      : "",
  };

  const isValid =
    !errors.name &&
    !errors.employeeId &&
    !errors.contact &&
    !errors.confirmDelete;

  const markAllTouched = () => {
    setTouched({
      name: true,
      employeeId: true,
      contact: true,
      confirmDelete: true,
    });
  };

  const handleSendRequest = () => {
    markAllTouched();

    if (!isValid) {
      setShowEmailNote(false);
      return;
    }

    const subject = encodeURIComponent("Data Deletion Request - WENS FORCE");
    const body = encodeURIComponent(
      `Name: ${trimmedName}\nEmployee ID: ${trimmedEmployeeId}\nRegistered Email/Phone: ${trimmedContact}\nReason: ${reason.trim() || "N/A"}\n\nI confirm I understand this will permanently delete my attendance and account data.`,
    );

    window.location.href = `mailto:wensforce@gmail.com?subject=${subject}&body=${body}`;
    setShowEmailNote(true);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-md">
        <div className="rounded-t-2xl bg-primary px-6 py-8 sm:px-8">
          <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            Data Deletion Request - WENS FORCE
          </h1>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/85 sm:text-base">
            Employees can request deletion of their personal data collected by
            the WENS FORCE attendance app, including attendance records,
            location check-in data, and selfie check-in photos, in line with
            our Privacy Policy.
          </p>
        </div>

        <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-semibold text-text-primary"
            >
              Full Name <span className="text-error">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-black/10"
            />
            {touched.name && errors.name && (
              <p className="mt-2 text-sm text-error">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="employeeId"
              className="mb-2 block text-sm font-semibold text-text-primary"
            >
              Employee ID <span className="text-error">*</span>
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, employeeId: true }))
              }
              placeholder="Enter your employee ID"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-black/10"
            />
            {touched.employeeId && errors.employeeId && (
              <p className="mt-2 text-sm text-error">{errors.employeeId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="contact"
              className="mb-2 block text-sm font-semibold text-text-primary"
            >
              Registered Email or Phone used in the app{" "}
              <span className="text-error">*</span>
            </label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, contact: true }))}
              placeholder="Enter your registered email or phone"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-black/10"
            />
            {touched.contact && errors.contact && (
              <p className="mt-2 text-sm text-error">{errors.contact}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-semibold text-text-primary"
            >
              Reason for deletion request (optional)
            </label>
            <textarea
              id="reason"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you are requesting data deletion"
              className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <label className="flex items-start gap-3 text-sm leading-6 text-text-primary">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, confirmDelete: true }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                I understand this will permanently delete my attendance and
                account data, and this action cannot be undone.
              </span>
            </label>
            {touched.confirmDelete && errors.confirmDelete && (
              <p className="mt-2 text-sm text-error">{errors.confirmDelete}</p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={!isValid}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Send Deletion Request via Email
            </button>

            {showEmailNote && (
              <p className="mt-3 text-sm text-text-secondary">
                Your email app should now open with the request pre-filled.
                Please press Send in your email app to complete the request.
              </p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              Prefer to email directly? Send your request to{" "}
              <a
                href="mailto:wensforce@gmail.com"
                className="font-semibold text-text-primary underline hover:opacity-70"
              >
                wensforce@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionRequest;
