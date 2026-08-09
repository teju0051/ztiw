"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TermsOfService() {
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
            &larr; Return to Previous Page
          </button>
        </div>

        {/* Document Header */}
        <div className="text-center border-b-2 border-black pb-8 mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-2">
            T-Service Global
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-gray-700 mb-6">
            Staff Portal — Terms of Service
          </h2>
          <div className="text-sm text-gray-500 font-medium">
            <p>Effective Date: 9 August 2026</p>
            <p>Last Updated: 9 August 2026</p>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-8 leading-relaxed text-justify text-[15px] sm:text-base">
          <section>
            <h3 className="font-bold text-lg mb-2">1. Acceptance of Terms</h3>
            <p className="mb-2">
              These Terms of Service ("Terms") govern access to and use of the
              T-Service Global Staff Portal ("Staff Portal", "Portal",
              "Service").
            </p>
            <p className="mb-2">
              By accessing or using the Staff Portal, you acknowledge that you
              have read, understood, and agreed to these Terms. Acceptance of
              these Terms is required before accessing the Staff Portal.
            </p>
            <p className="font-semibold">
              If you do not agree to these Terms, you must not access or use the
              Staff Portal.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">2. Eligibility</h3>
            <p className="mb-2">
              The Staff Portal is an internal system intended exclusively for
              authorized T-Service Global staff members. To use the Staff
              Portal, a person must:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Be an authorized staff member of T-Service Global.</li>
              <li>Be 18 years of age or older.</li>
              <li>
                Have an account created or authorized by T-Service Global.
              </li>
              <li>Maintain valid and authorized access credentials.</li>
            </ul>
            <p>
              The Staff Portal is not available for public registration or
              general public use.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              3. Purpose of the Staff Portal
            </h3>
            <p className="mb-2">
              The Staff Portal is provided to support internal T-Service Global
              operations. Authorized staff may use the Portal for legitimate
              work-related activities, including:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Managing assigned tasks.</li>
              <li>Managing and tracking deadlines.</li>
              <li>Receiving and sending internal messages.</li>
              <li>Viewing organizational communications.</li>
              <li>Accessing authorized staff resources.</li>
              <li>Submitting or managing work-related information.</li>
              <li>Monitoring task and work status.</li>
              <li>
                Other legitimate activities authorized by T-Service Global.
              </li>
            </ul>
            <p>
              Use of the Portal must remain related to legitimate organizational
              or work purposes.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">4. Account Access</h3>
            <p className="mb-2">
              Staff accounts are provided through authorized T-Service Global
              administration. Staff members must:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Keep their login credentials confidential.</li>
              <li>Not share their account with another person.</li>
              <li>Not allow another person to use their account.</li>
              <li>Not attempt to access another staff member's account.</li>
              <li>Immediately report suspected unauthorized access.</li>
              <li>Use the Portal only through their authorized account.</li>
            </ul>
            <p>
              Staff members are responsible for activity performed through their
              account unless unauthorized access has been promptly reported.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">5. Prohibited Activities</h3>
            <p className="mb-2">
              Staff members must not use the Staff Portal to:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Share harmful or malicious content.</li>
              <li>
                Upload or distribute malware, viruses, or other malicious files.
              </li>
              <li>Share sexually explicit, pornographic, or 18+ material.</li>
              <li>
                Share offensive, abusive, threatening, or inappropriate content.
              </li>
              <li>
                Harass, intimidate, or discriminate against another person.
              </li>
              <li>Attempt unauthorized access to accounts or systems.</li>
              <li>Bypass or disable security controls.</li>
              <li>Exploit vulnerabilities without authorization.</li>
              <li>Interfere with Portal functionality.</li>
              <li>Damage, disrupt, or compromise T-Service Global systems.</li>
              <li>Impersonate another staff member.</li>
              <li>Misuse company information.</li>
              <li>Use the Portal for unlawful activities.</li>
              <li>
                Attempt to obtain information to which the staff member is not
                authorized.
              </li>
              <li>Circumvent administrative controls or restrictions.</li>
            </ul>
            <p className="font-semibold text-black">
              Any suspected unauthorized access attempt may result in immediate
              suspension pending investigation.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">6. Confidentiality</h3>
            <p className="mb-2">
              All information available through the Staff Portal is considered
              strictly confidential unless T-Service Global expressly determines
              otherwise. Staff members must not:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Share internal information with external persons.</li>
              <li>Copy confidential information for unauthorized purposes.</li>
              <li>Publish internal information publicly.</li>
              <li>
                Forward confidential messages outside authorized channels.
              </li>
              <li>
                Photograph or screen-record confidential Portal information.
              </li>
              <li>
                Download, reproduce, or distribute confidential Portal content
                without authorization.
              </li>
              <li>
                Disclose company documents, tasks, communications, employee
                information, or other internal information to unauthorized
                persons.
              </li>
            </ul>
            <p>
              Confidential information may only be used for authorized T-Service
              Global purposes.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              7. Ownership of Portal and Content
            </h3>
            <p className="mb-2">
              The Staff Portal and its associated materials are owned and
              controlled by T-Service Global. This includes, where applicable:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Portal software and functionality.</li>
              <li>Branding and trademarks.</li>
              <li>Internal documents.</li>
              <li>Internal communications.</li>
              <li>Task information.</li>
              <li>Organizational data.</li>
              <li>Designs and interfaces.</li>
              <li>Internal resources.</li>
              <li>Other company-created materials.</li>
            </ul>
            <p>
              Nothing in these Terms grants staff members ownership or
              intellectual property rights over T-Service Global property.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              8. Content and Communications
            </h3>
            <p className="mb-2">
              Staff members may create, submit, edit, or communicate
              work-related information through the Staff Portal.
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>
                Staff members may edit applicable content where the Portal
                permits editing.
              </li>
              <li>
                Staff members may not delete Portal records unless deletion
                functionality is expressly provided and authorized by T-Service
                Global administrators.
              </li>
            </ul>
            <p>
              Staff members remain responsible for ensuring that submitted
              content is accurate, appropriate, professional, and relevant to
              legitimate work activities.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              9. Monitoring and Activity Logging
            </h3>
            <p className="mb-2">
              T-Service Global may monitor and log Staff Portal activity for
              legitimate organizational purposes, including:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Security monitoring.</li>
              <li>Access control.</li>
              <li>Task management.</li>
              <li>Compliance.</li>
              <li>Investigation of suspected misconduct.</li>
              <li>Prevention of unauthorized access.</li>
              <li>Protection of company systems.</li>
              <li>Auditing and accountability.</li>
              <li>Detection of misuse or security incidents.</li>
            </ul>
            <p className="mb-2">
              Portal activity may include login information, access records,
              task activity, messages, system events, and other relevant
              activity logs.
            </p>
            <p>
              Monitoring will be handled in accordance with applicable laws and
              the T-Service Global Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              10. Security Investigations
            </h3>
            <p className="mb-2">T-Service Global may investigate suspected:</p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Unauthorized access.</li>
              <li>Account misuse.</li>
              <li>Confidentiality violations.</li>
              <li>Security breaches.</li>
              <li>Harassment or abusive conduct.</li>
              <li>Misuse of company systems.</li>
              <li>Policy violations.</li>
              <li>Other inappropriate or unauthorized activity.</li>
            </ul>
            <p>
              Staff members may be required to cooperate with legitimate
              internal investigations.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">11. Disciplinary Process</h3>
            <p className="mb-2">
              Where a staff member is suspected of violating these Terms,
              T-Service Global may conduct an internal investigation. The staff
              member and their Team Lead or Manager may be involved in the
              investigation and review process.
            </p>
            <p className="mb-2">
              If the staff member is found responsible for a violation,
              T-Service Global may take disciplinary action. The standard
              disciplinary structure is:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2 font-medium">
              <li>First violation: Warning</li>
              <li>Second violation: Suspension</li>
              <li>Third violation: Termination</li>
            </ul>
            <p className="mb-2">
              Depending on the seriousness of the violation, T-Service Global
              may take stronger or immediate action where permitted by
              applicable law.
            </p>
            <p className="font-semibold text-black">
              Serious misconduct, security violations, unauthorized access,
              confidentiality breaches, or unlawful activity may result in
              immediate suspension or other appropriate action without
              necessarily following the standard warning sequence.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">12. Unauthorized Access</h3>
            <p className="mb-2">Any attempt to access:</p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Another staff member's account.</li>
              <li>Restricted Portal areas.</li>
              <li>Administrative functionality.</li>
              <li>Company systems without authorization.</li>
              <li>Data outside the user's permitted access level.</li>
            </ul>
            <p className="mb-2">
              may result in immediate account suspension and a security
              investigation.
            </p>
            <p>
              Where appropriate, T-Service Global may take disciplinary and/or
              legal action.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">13. Legal Action</h3>
            <p className="mb-2">
              T-Service Global reserves the right to pursue appropriate legal
              remedies where a staff member intentionally:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Leaks confidential information.</li>
              <li>Misuses company systems.</li>
              <li>Attempts unauthorized access.</li>
              <li>Damages or compromises systems.</li>
              <li>Distributes prohibited or malicious content.</li>
              <li>
                Commits unlawful acts through or against the Staff Portal.
              </li>
              <li>
                Causes material harm to T-Service Global or its personnel.
              </li>
            </ul>
            <p>
              Nothing in these Terms limits any rights or remedies available to
              T-Service Global under applicable Indian law.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              14. Account Suspension and Termination
            </h3>
            <p className="mb-2">
              T-Service Global may suspend or terminate access where necessary
              for:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Security reasons.</li>
              <li>Policy violations.</li>
              <li>Unauthorized access.</li>
              <li>Misuse of the Portal.</li>
              <li>Disciplinary action.</li>
              <li>End of employment or engagement.</li>
              <li>Other legitimate organizational reasons.</li>
            </ul>
            <p>
              A Team Lead may appeal or raise a request regarding an account
              termination decision, but final account termination authority
              rests with authorized T-Service Global administrators.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              15. Termination of Employment or Engagement
            </h3>
            <p className="mb-2">
              When a staff member's employment, internship, contract, or
              authorized engagement with T-Service Global ends:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Their Staff Portal account will be disabled.</li>
              <li>Their access to the Staff Portal will be revoked.</li>
              <li>
                Staff-related data associated with their account will be removed
                permanently from the system, subject to applicable legal or
                regulatory requirements.
              </li>
            </ul>
            <p>
              Data handling following termination is also governed by the
              T-Service Global Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              16. Portal Availability and Changes
            </h3>
            <p className="mb-2">
              T-Service Global may temporarily suspend, modify, restrict, or
              discontinue the Staff Portal or any feature of it for reasons
              including:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Maintenance.</li>
              <li>Security updates.</li>
              <li>Technical upgrades.</li>
              <li>System failures.</li>
              <li>Investigations.</li>
              <li>Operational requirements.</li>
              <li>Security incidents.</li>
              <li>Other legitimate organizational reasons.</li>
            </ul>
            <p>
              T-Service Global does not guarantee uninterrupted or error-free
              availability of the Staff Portal.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              17. No Unauthorized Exceptions
            </h3>
            <p className="mb-2">
              These Terms apply to all authorized Staff Portal users.
            </p>
            <p className="mb-2">
              Staff members may not create, grant, or assume exceptions to these
              Terms without explicit authority from T-Service Global.
            </p>
            <p>
              Unauthorized permission or approval from an individual does not
              override these Terms.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              18. Administrator Authority
            </h3>
            <p className="mb-2">
              Authorized T-Service Global administrators have final
              administrative authority over the Staff Portal, including:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Account creation and management.</li>
              <li>Access permissions.</li>
              <li>Security controls.</li>
              <li>Account suspension.</li>
              <li>Account termination.</li>
              <li>Security investigations.</li>
              <li>Enforcement of these Terms.</li>
              <li>Portal configuration and availability.</li>
            </ul>
            <p>
              Administrative decisions will be made subject to applicable law
              and relevant internal procedures.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">19. Privacy</h3>
            <p className="mb-2">
              Staff information processed through the Staff Portal is handled in
              accordance with the T-Service Global Staff Portal Privacy Policy.
              The Privacy Policy explains:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>What staff information is collected.</li>
              <li>How information is used.</li>
              <li>Where information is stored.</li>
              <li>Data retention.</li>
              <li>Security measures.</li>
              <li>Staff privacy rights.</li>
              <li>Data protection contact information.</li>
            </ul>
            <p>
              Staff members should review the Privacy Policy before using the
              Staff Portal.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">20. Governing Law</h3>
            <p className="mb-2">
              These Terms shall be governed by and interpreted in accordance
              with the applicable laws of India.
            </p>
            <p>
              Any legal matter arising in connection with the Staff Portal or
              these Terms shall be handled in accordance with applicable Indian
              law.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">
              21. Changes to These Terms
            </h3>
            <p className="mb-2">
              T-Service Global may modify these Terms when necessary due to:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>Changes to the Staff Portal.</li>
              <li>Changes in organizational policies.</li>
              <li>Security requirements.</li>
              <li>Legal or regulatory requirements.</li>
              <li>Changes in operational practices.</li>
            </ul>
            <p className="mb-2">
              Updated Terms may be presented to staff members through the Staff
              Portal.
            </p>
            <p className="mb-2">
              Staff members will be required to review and accept updated Terms
              through the login process where T-Service Global requires renewed
              acceptance.
            </p>
            <p>
              Continued use of the Staff Portal after valid acceptance of
              updated Terms constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2">22. Contact</h3>
            <p className="mb-2">
              For questions regarding these Terms, staff members should contact
              the appropriate T-Service Global internal administration or
              management channel.
            </p>
            <p className="mb-2">For privacy-specific matters, contact:</p>
            <div className="pl-4 border-l-4 border-gray-300">
              <p>Data Protection Officer</p>
              <p>T-Service Global</p>
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
            <h3 className="font-bold text-lg mb-2">23. Acknowledgement</h3>
            <p className="mb-2">
              By selecting "I Agree" and accessing the Staff Portal, the staff
              member confirms that:
            </p>
            <ul className="list-disc pl-8 space-y-1 mb-2">
              <li>They have read these Terms.</li>
              <li>They understand the rules governing Portal usage.</li>
              <li>They agree to comply with these Terms.</li>
              <li>
                They understand that violations may result in disciplinary
                action.
              </li>
              <li>
                They understand that unauthorized access may result in immediate
                suspension.
              </li>
              <li>
                They understand that confidential company information must not
                be disclosed externally.
              </li>
              <li>
                They understand that their Portal activity may be monitored for
                legitimate organizational and security purposes.
              </li>
            </ul>
            <p className="font-semibold text-black">
              Acceptance of these Terms is mandatory for Staff Portal access.
            </p>
          </section>
        </div>

        {/* Document Footer */}
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-sm font-semibold text-gray-500 pb-12">
          &copy; 2026 T-Service Global. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
