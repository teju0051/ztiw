"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();

  useEffect(() => {
    // Force scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white py-12 px-6 sm:px-12 lg:px-24 text-gray-900 font-sans selection:bg-gray-300">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-10 print:hidden">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-gray-600 hover:text-black transition-colors underline underline-offset-4"
          >
            &larr;Return to Login Page
          </button>
        </div>

        {/* Document Header */}
        <div className="text-center border-b-2 border-black pb-8 mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-2">
            T-Service
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-gray-700 mb-6">
            Staff Portal — Privacy Policy
          </h2>
          <div className="text-sm text-gray-500 font-medium">
            <p>Effective Date: 9 August 2026</p>
            <p>Last Updated: 9 August 2026</p>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-8 leading-relaxed text-justify text-[15px] sm:text-base">
          <section>
            <h3 className="font-bold text-lg mb-2">1. Introduction</h3>
            <p className="mb-2">
              T-Service ("T-Service", "we", "us", or "our") respects the privacy
              of its employees, interns, contractors, and other authorized staff
              members ("Staff", "you", or "your").
            </p>
            <p className="mb-2">
              This Privacy Policy explains how T-Service collects, uses, stores,
              protects, and manages personal information through its Staff
              Portal and related internal systems.
            </p>
            <p>
              By accessing or using the Staff Portal, you acknowledge that you
              have read and understood this Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">2. Scope</h3>
            <p className="mb-2">
              This Privacy Policy applies to personal information processed
              through the T-Service Staff Portal and associated internal
              systems, including information relating to:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Employees</li>
              <li>Interns</li>
              <li>Contractors</li>
              <li>Team members</li>
              <li>Authorized staff and personnel</li>
            </ul>
            <p>
              This policy applies to information collected through the Staff
              Portal, company systems, and related internal services.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              3. Information We Collect
            </h3>
            <p className="mb-4">
              T-Service may collect and process information necessary for
              legitimate organizational and operational purposes, including:
            </p>

            <div className="space-y-4 ml-4">
              <div>
                <h4 className="font-semibold italic">
                  3.1 Identity Information
                </h4>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Full name</li>
                  <li>Date of birth, where required</li>
                  <li>Staff/employee ID</li>
                  <li>Profile information</li>
                  <li>Identification information where required</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold italic">
                  3.2 Contact Information
                </h4>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Email address</li>
                  <li>Telephone/mobile number</li>
                  <li>Emergency contact information, where applicable</li>
                  <li>Communication details</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold italic">
                  3.3 Account and Authentication Information
                </h4>
                <ul className="list-disc pl-8 space-y-1 mb-2">
                  <li>Username</li>
                  <li>
                    Password credentials or securely stored authentication
                    information
                  </li>
                  <li>Login records</li>
                  <li>Account status</li>
                  <li>Authentication and authorization information</li>
                </ul>
                <p className="text-sm text-gray-600">
                  T-Service does not intend to store passwords in plain text.
                </p>
              </div>

              <div>
                <h4 className="font-semibold italic">
                  3.4 Employment and Work Information
                </h4>
                <ul className="list-disc pl-8 space-y-1">
                  <li>Role and designation</li>
                  <li>Department/team</li>
                  <li>Joining information</li>
                  <li>Employment status</li>
                  <li>Work assignments</li>
                  <li>Task records</li>
                  <li>Attendance</li>
                  <li>Working schedules</li>
                  <li>Performance-related information</li>
                  <li>Internal communications</li>
                  <li>Training and development records</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold italic">
                  3.5 Technical and Security Information
                </h4>
                <p className="mb-2">
                  The Staff Portal may automatically process technical
                  information such as:
                </p>
                <ul className="list-disc pl-8 space-y-1">
                  <li>IP address</li>
                  <li>Browser information</li>
                  <li>Device information</li>
                  <li>Operating system</li>
                  <li>Login timestamps</li>
                  <li>Access logs</li>
                  <li>Security logs</li>
                  <li>Session information</li>
                  <li>
                    Portal activity required for security and administration
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">4. Purpose of Processing</h3>
            <p className="mb-2">
              T-Service may use Staff information for legitimate business and
              organizational purposes, including:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Managing staff accounts</li>
              <li>Verifying staff identity</li>
              <li>Managing employment and onboarding</li>
              <li>Assigning and tracking tasks</li>
              <li>Managing attendance and work schedules</li>
              <li>Monitoring work-related activities where appropriate</li>
              <li>Managing performance and training</li>
              <li>Communicating with staff</li>
              <li>Providing access to internal systems</li>
              <li>Maintaining organizational records</li>
              <li>Protecting company systems and information</li>
              <li>Detecting and preventing unauthorized access</li>
              <li>Investigating security incidents</li>
              <li>Maintaining audit and activity logs</li>
              <li>Complying with applicable legal obligations</li>
              <li>
                Performing other legitimate administrative and operational
                functions
              </li>
            </ul>
            <p>
              T-Service will seek to process personal information only for
              appropriate and legitimate purposes.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              5. Access to Staff Information
            </h3>
            <p className="mb-2">
              Access to staff information is restricted to authorized internal
              staff who require access for legitimate organizational purposes.
            </p>
            <p className="mb-2">
              Access may be granted according to the individual's role,
              responsibilities, and authorization level.
            </p>
            <p>
              Staff information should not be accessed, copied, disclosed, or
              distributed by unauthorized personnel.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">6. Data Storage</h3>
            <p className="mb-2">Staff information may be stored using:</p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>T-Service company servers; and</li>
              <li>Supabase infrastructure used by T-Service.</li>
            </ul>
            <p className="mb-2">
              T-Service will take reasonable measures to maintain appropriate
              security controls over information stored within these systems.
            </p>
            <p>
              Where third-party infrastructure or service providers are used,
              information may be processed or stored in accordance with the
              applicable service provider's infrastructure and contractual
              arrangements.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">7. Data Retention</h3>
            <p className="mb-2">
              T-Service generally retains staff information until the
              individual's employment, internship, contract, or other engagement
              with T-Service ends.
            </p>
            <p className="mb-2">
              Certain information may be retained for a longer period where
              reasonably necessary for:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Legal or regulatory compliance</li>
              <li>Accounting or financial requirements</li>
              <li>Dispute resolution</li>
              <li>Security and fraud prevention</li>
              <li>Protection of legal rights</li>
              <li>Legitimate business record-keeping</li>
            </ul>
            <p>
              When information is no longer required, T-Service may delete,
              anonymize, or securely dispose of it in accordance with applicable
              requirements and internal procedures.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">8. Data Security</h3>
            <p className="mb-2">
              T-Service takes reasonable technical and organizational measures
              to protect staff information against unauthorized access,
              alteration, disclosure, loss, misuse, or destruction. Security
              measures may include:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Authentication and access controls</li>
              <li>Role-based access</li>
              <li>Password protection</li>
              <li>Secure database configuration</li>
              <li>Server security controls</li>
              <li>Activity and security logging</li>
              <li>Access monitoring</li>
              <li>Administrative safeguards</li>
              <li>Security reviews and incident response procedures</li>
            </ul>
            <p className="font-semibold">
              However, no electronic system can be guaranteed to be completely
              secure.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              9. Security Incidents and Data Breaches
            </h3>
            <p className="mb-2">
              If T-Service becomes aware of a security incident or data breach
              that materially affects staff personal information, T-Service will
              assess the incident and take appropriate measures to contain,
              investigate, and remediate it.
            </p>
            <p className="mb-2">
              Where required or appropriate, affected staff members will be
              notified regarding the incident and relevant protective measures.
            </p>
            <p>
              T-Service may also make notifications to applicable authorities
              where required under Indian law.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">10. Staff Privacy Rights</h3>
            <p className="mb-2">
              Subject to applicable law and reasonable verification
              requirements, staff members may request:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Access to their personal information</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>
                Deletion of personal information where legally permissible
              </li>
            </ul>
            <p className="mb-2">
              Requests may be submitted to the T-Service Data Protection Officer
              using the contact details provided in this Privacy Policy.
            </p>
            <p>
              T-Service may decline or limit a request where retention or
              processing is required by law, necessary for legitimate
              organizational purposes, or otherwise permitted under applicable
              law.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              11. Data Protection Officer
            </h3>
            <p className="mb-2">
              T-Service has designated a Data Protection Officer ("DPO") to
              handle privacy-related requests and concerns.
            </p>
            <div className="pl-4 border-l-4 border-gray-300 mb-4">
              <p>
                <strong>Data Protection Officer</strong>
              </p>
              <p>Organization: T-Service</p>
              <p>Email: admin.tserviceglobal@gmail.com</p>
            </div>
            <p className="mb-2">Staff may contact the DPO regarding:</p>
            <ul className="list-disc pl-8 space-y-1">
              <li>Privacy concerns</li>
              <li>Personal information requests</li>
              <li>Data correction requests</li>
              <li>Data deletion requests</li>
              <li>Questions regarding this Privacy Policy</li>
              <li>Suspected privacy or security incidents</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              12. Disclosure of Information
            </h3>
            <p className="mb-2">
              T-Service does not permit unauthorized disclosure of staff
              personal information.
            </p>
            <p className="mb-2">
              Information may be disclosed where reasonably necessary to:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Authorized internal personnel</li>
              <li>Authorized service providers</li>
              <li>IT and infrastructure providers</li>
              <li>Security or technical service providers</li>
              <li>Legal or regulatory authorities where required</li>
              <li>
                Protect T-Service's rights, systems, property, or personnel
              </li>
              <li>Comply with applicable legal obligations</li>
            </ul>
            <p>
              Any access or disclosure should be limited to information
              reasonably necessary for the relevant purpose.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">13. Third-Party Services</h3>
            <p className="mb-2">
              The Staff Portal may rely on third-party infrastructure or
              technology providers, including Supabase.
            </p>
            <p className="mb-2">
              Such providers may process information on behalf of T-Service as
              necessary to provide infrastructure, authentication, database,
              hosting, security, or related services.
            </p>
            <p>
              T-Service expects applicable service providers to maintain
              appropriate security and confidentiality safeguards.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              14. Employee Responsibilities
            </h3>
            <p className="mb-2">
              Staff members are responsible for protecting their own account
              credentials and must:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-4">
              <li>
                Keep passwords and authentication credentials confidential
              </li>
              <li>Not share accounts</li>
              <li>
                Not allow unauthorized individuals to access the Staff Portal
              </li>
              <li>Log out of systems when appropriate</li>
              <li>Report suspected unauthorized access</li>
              <li>Report suspected security incidents promptly</li>
              <li>Access staff information only when authorized</li>
              <li>
                Not copy or disclose confidential staff information without
                authorization
              </li>
            </ul>
            <p className="font-semibold text-black">
              Unauthorized access or misuse of staff information may result in
              disciplinary or other appropriate action.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">15. Children's Data</h3>
            <p className="mb-2">
              The Staff Portal is an internal organizational system and is not
              intended for children.
            </p>
            <p>
              T-Service does not knowingly collect children's personal
              information through the Staff Portal unless such collection is
              necessary and legally permitted for a specific organizational
              purpose.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              16. Changes to This Privacy Policy
            </h3>
            <p className="mb-2">
              T-Service may update this Privacy Policy from time to time to
              reflect changes in:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Applicable laws</li>
              <li>Organizational practices</li>
              <li>Staff Portal functionality</li>
              <li>Security requirements</li>
              <li>Data-processing practices</li>
            </ul>
            <p className="mb-2">
              The updated version will be made available through the Staff
              Portal or another appropriate internal communication channel.
            </p>
            <p>
              The "Last Updated" date at the beginning of this policy will
              indicate when the policy was most recently revised.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">17. Applicable Law</h3>
            <p className="mb-2">
              This Privacy Policy is intended to operate in accordance with
              applicable laws and regulations of India, including applicable
              provisions of the Digital Personal Data Protection Act, 2023, and
              associated rules, regulations, notifications, and amendments, as
              applicable to T-Service and its processing activities.
            </p>
            <p>
              Where applicable law provides additional rights or protections,
              those requirements will prevail to the extent of any inconsistency
              with this policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">18. Contact Us</h3>
            <p className="mb-2">
              For questions, requests, or concerns regarding this Privacy Policy
              or the handling of staff personal information, contact:
            </p>
            <div className="pl-4 border-l-4 border-gray-300">
              <p>T-Service</p>
              <p>Akhil Atkari (Data Protection Officer)</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:admin.tserviceglobal@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  admin.tserviceglobal@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              19. Staff Acknowledgement
            </h3>
            <p>
              By accessing and using the T-Service Staff Portal, staff members
              acknowledge that they have been provided access to this Privacy
              Policy and understand how their personal information may be
              processed for legitimate organizational, employment, operational,
              administrative, and security purposes.
            </p>
          </section>
        </div>

        {/* Document Footer */}
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-sm font-semibold text-gray-500 pb-12">
          &copy; 2026 T-Service. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
