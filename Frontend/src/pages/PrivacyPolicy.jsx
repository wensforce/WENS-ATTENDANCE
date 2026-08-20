const sectionTitleClass = "text-2xl md:text-3xl font-bold text-text-primary";
const subTitleClass = "text-xl font-semibold text-text-primary";
const bodyClass = "text-text-secondary leading-7";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-surface rounded-2xl shadow-md border border-border overflow-hidden">
        <div className="bg-primary px-6 py-10 sm:px-10">
          <p className="text-primary-foreground/80 text-sm font-medium tracking-wide uppercase">
            WENS FORCE - Attendance App
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-primary-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-primary-foreground/80 text-sm sm:text-base">
            Last updated: August 20, 2026
          </p>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
          <p className={bodyClass}>
            WENS FORCE ("we," "us," or "our") operates the WENS FORCE
            attendance application, available on web and mobile
            platforms (the "App"). This Privacy Policy explains how we collect,
            use, disclose, and safeguard information when using the App to
            record and manage attendance.
          </p>

          <p className={bodyClass}>
            The App is currently developed and used <strong>internally by WENS FORCE only</strong>, for
            its own employees. It is not offered to other companies or
            organizations at this time. If the App is later made available to
            other businesses (multi-tenant use), this Privacy Policy will be
            updated accordingly, and users/organizations will be notified of the
            changes.
          </p>

          <p className={bodyClass}>
            By using the App, you agree to the collection and use of information
            in accordance with this policy.
          </p>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>1. Information We Collect</h2>

            <div className="space-y-3">
              <h3 className={subTitleClass}>1.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
                <li>
                  <strong>Account information:</strong> name, employee ID, email
                  address, phone number, job title, department, and password
                  (stored securely, never in plain text).
                </li>
                <li>
                  <strong>Employer/organization information:</strong> company
                  name, HR/admin contact details, and organizational structure
                  needed to manage attendance records.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className={subTitleClass}>1.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
                <li>
                  <strong>Attendance data:</strong> clock-in/clock-out
                  timestamps, shift schedules, leave requests, and attendance
                  history.
                </li>
                <li>
                  <strong>Location data:</strong> with your permission, we
                  collect GPS location at the time of clock-in/clock-out to
                  verify that attendance is being marked from an authorized
                  location (for example office premises or an approved
                  worksite). Location may be collected in the background only
                  during active clock-in sessions, not continuously.
                </li>
                <li>
                  <strong>Selfie / check-in photo:</strong> with your permission,
                  we capture a photo ("selfie") of you at the time of
                  clock-in/clock-out through your device camera. This photo is
                  used to verify your identity and confirm that attendance is
                  being marked by the actual employee, not someone else on their
                  behalf. The photo is stored securely along with the
                  corresponding attendance record.
                </li>
                <li>
                  <strong>Device information:</strong> device type, operating
                  system, unique device identifiers, IP address, and browser
                  type (for the web app).
                </li>
                <li>
                  <strong>Usage data:</strong> app interactions, login
                  timestamps, and diagnostic/crash logs to help us improve the
                  App.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className={subTitleClass}>1.3 Information From Your Employer</h3>
              <p className={bodyClass}>
                If your organization has enrolled you in the App, your employer
                or an authorized administrator may provide us with your
                employment details (such as name, role, and reporting manager)
                to set up and manage your account.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>2. How We Use Your Information</h2>
            <p className={bodyClass}>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
              <li>Record, verify, and manage employee attendance and work hours.</li>
              <li>Confirm that attendance is marked from an approved location.</li>
              <li>
                Generate attendance reports, timesheets, and analytics for
                employers/administrators.
              </li>
              <li>Authenticate user accounts and prevent unauthorized access.</li>
              <li>
                Send notifications related to attendance, shifts, or account
                activity.
              </li>
              <li>
                Maintain, troubleshoot, and improve App functionality and
                security.
              </li>
              <li>
                Comply with legal, regulatory, or labor law obligations.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>3. Location Data</h2>
            <p className={bodyClass}>
              The App collects <strong>precise location data only at the moment of
              clock-in and clock-out</strong>, and only with your explicit permission
              granted through your device settings. This data is used solely to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
              <li>
                Confirm attendance is being marked within an authorized work
                location or geofence set by your employer.
              </li>
              <li>Prevent fraudulent or remote attendance marking.</li>
            </ul>
            <p className={bodyClass}>
              You may disable location permissions at any time through your
              device settings; however, doing so may prevent you from
              successfully marking attendance if your employer requires location
              verification. We do not track your location outside of
              clock-in/clock-out events.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>4. Selfie / Photo Check-In Data</h2>
            <p className={bodyClass}>
              To prevent attendance fraud (such as "buddy punching," where one
              employee marks attendance on behalf of another), the App may
              require you to take a <strong>selfie photo</strong> at the time of
              clock-in and/or clock-out.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
              <li>
                The photo is captured only at the moment of
                check-in/check-out, with your permission via your device camera.
              </li>
              <li>
                The photo is used solely to visually verify your identity
                against your employee profile and is reviewed by authorized WENS
                FORCE administrators as part of attendance verification.
              </li>
              <li>
                Photos are stored securely on encrypted servers alongside your
                attendance record and are retained for as long as your attendance
                record is retained (see <strong>Section 7: Data Retention</strong>).
              </li>
              <li>
                We do not use facial recognition or biometric matching software
                on these photos at this time; they are used for manual/visual
                verification purposes only. If this changes in the future (for
                example automated facial recognition), we will update this policy
                and, where required by law, seek your separate consent.
              </li>
              <li>
                You may withdraw camera permission through your device settings;
                however, doing so may prevent you from completing check-in if
                your employer requires photo verification.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>5. Who We Share Information With</h2>
            <p className={bodyClass}>
              We do <strong>not</strong> sell your personal information. We may
              share information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
              <li>
                <strong>Your employer/organization:</strong> attendance records,
                timestamps, and location data at check-in/check-out are visible
                to your employer's HR or administrative staff, as this is the
                core function of the App.
              </li>
              <li>
                <strong>Service providers:</strong> third-party vendors who help
                us with hosting, cloud storage, analytics, and customer support,
                under confidentiality obligations.
              </li>
              <li>
                <strong>Legal authorities:</strong> when required to comply with
                applicable law, legal process, or government request.
              </li>
              <li>
                <strong>Business transfers:</strong> in connection with a merger,
                acquisition, or sale of assets, subject to standard
                confidentiality protections.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>6. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary leading-7">
              <li>Attendance and personal data are stored on secure, encrypted servers.</li>
              <li>
                We use industry-standard security measures, including encryption
                in transit (HTTPS/TLS) and access controls, to protect your data
                from unauthorized access, alteration, or disclosure.
              </li>
              <li>
                Access to attendance records is restricted to authorized
                personnel within your organization and our support team, on a
                need-to-know basis.
              </li>
              <li>
                While we strive to protect your data, no method of electronic
                transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>7. Data Retention</h2>
            <p className={bodyClass}>
              We retain attendance and account data for as long as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 leading-7">
              <li>Your account remains active with your employer's organization.</li>
              <li>
                It is necessary to comply with legal, tax, labor, or regulatory
                obligations.
              </li>
            </ul>
            <p className={bodyClass}>
              Upon request or account deletion (subject to your employer's data
              retention policies), we will delete or anonymize your personal
              data, except where retention is required by law.
            </p>
            <p className={bodyClass}>
              To submit a formal deletion request, use our{" "}
              <a
                href="/data-deletion-request"
                className="font-semibold text-text-primary underline hover:opacity-70"
              >
                Data Deletion Request page
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>8. Your Rights</h2>
            <p className={bodyClass}>
              Depending on your location and applicable law, you may have the
              right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 leading-7">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>
                Request deletion of your data (subject to your employer's
                records requirements).
              </li>
              <li>
                Submit a deletion request through the Data Deletion Request
                page for faster processing.
              </li>
              <li>
                Withdraw consent for location tracking or selfie/photo check-in
                (may affect App functionality).
              </li>
              <li>Object to or restrict certain processing of your data.</li>
            </ul>
            <p className={bodyClass}>
              To exercise these rights, contact us at <strong>wensforce@gmail.com</strong>.
              Note that some requests may need to be routed through your
              employer, as they are the primary controller of your employment
              records.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>9. Children's Privacy</h2>
            <p className={bodyClass}>
              The App is intended for use by working professionals and is not
              directed at individuals under the age of 18. We do not knowingly
              collect data from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>10. Third-Party Links and Services</h2>
            <p className={bodyClass}>
              The App may contain links to third-party services (for example
              payroll or HR integrations). We are not responsible for the
              privacy practices of these third parties. Please review their
              respective privacy policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>11. Changes to This Privacy Policy</h2>
            <p className={bodyClass}>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated "Last updated" date.
              Continued use of the App after changes constitutes acceptance of
              the revised policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={sectionTitleClass}>12. Contact Us</h2>
            <p className={bodyClass}>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
            <div className="rounded-xl border border-border bg-background p-4 text-text-primary">
              <p className="font-semibold text-text-primary">WENS FORCE</p>
              <p>
                Email:{" "}
                <a className="text-text-primary underline hover:opacity-70" href="mailto:wensforce@gmail.com">
                  wensforce@gmail.com
                </a>
              </p>
            </div>
          </section>

          <div className="border-t border-border pt-6">
            <p className="text-sm text-text-muted italic">
              This document is provided as a general template and does not
              constitute legal advice. Depending on your jurisdiction and
              industry, you may need to consult a lawyer to ensure full
              compliance with applicable data protection laws (for example
              GDPR, CCPA, India's DPDP Act, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
