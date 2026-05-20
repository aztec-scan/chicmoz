import { type FC } from "react";
import { StaticPage } from "./static-page";

const CONTACT_EMAIL = "info@obscura.network";

export const PrivacyPolicyPage: FC = () => (
  <StaticPage
    slug="privacy"
    title="Privacy notice"
    subtitle="Last updated 21 September 2024"
    comment="how we collect, use, and share your information"
  >
    <p>
      This privacy notice for Send Return B.V. (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
      or &ldquo;our&rdquo;), describes how and why we might collect, store, use,
      and/or share (&ldquo;process&rdquo;) your information when you use our
      services (&ldquo;Services&rdquo;), such as when you:
    </p>
    <ul>
      <li>
        Visit our website at https://aztecscan.xyz, or any website of ours that
        links to this privacy notice
      </li>
      <li>
        Engage with us in other related ways — including any sales, marketing,
        or events
      </li>
    </ul>
    <p>
      <strong>Questions or concerns?</strong> Reading this privacy notice will
      help you understand your privacy rights and choices. If you do not agree
      with our policies and practices, please do not use our Services. If you
      still have any questions or concerns, please contact us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <h2>1. What information do we collect?</h2>
    <p>
      <em>In short:</em> Some information — such as your Internet Protocol (IP)
      address and/or browser and device characteristics — is collected
      automatically when you visit our Services.
    </p>
    <p>
      We automatically collect certain information when you visit, use, or
      navigate the Services. This information does not reveal your specific
      identity (like your name or contact information) but may include device
      and usage information, such as your IP address, browser and device
      characteristics, operating system, language preferences, referring URLs,
      device name, country, location, information about how and when you use
      our Services, and other technical information. This information is
      primarily needed to maintain the security and operation of our Services,
      and for our internal analytics and reporting purposes.
    </p>
    <p>The information we collect includes:</p>
    <ul>
      <li>
        <strong>Log and usage data.</strong> Service-related, diagnostic, usage
        and performance information our servers automatically collect when you
        access or use our Services and which we record in log files.
      </li>
      <li>
        <strong>Device data.</strong> Information about your computer, phone,
        tablet, or other device you use to access the Services.
      </li>
    </ul>

    <h3>Analytics</h3>
    <p>
      We use a self-hosted instance of Plausible Analytics to collect anonymous
      usage statistics about our website. Because we self-host, your data is
      not shared with any third-party analytics provider and remains under our
      control on our servers located in the EU.
    </p>
    <p>Plausible Analytics is privacy-focused and:</p>
    <ul>
      <li>Does not use cookies</li>
      <li>Does not collect personal information</li>
      <li>Does not track users across websites</li>
      <li>
        Collects only minimal, aggregated usage data (page views, referrer
        sources, and anonymous device information)
      </li>
    </ul>

    <h2>2. How do we process your information?</h2>
    <p>
      <em>In short:</em> We process your information to provide, improve, and
      administer our Services, communicate with you, for security and fraud
      prevention, and to comply with law. We may also process your information
      for other purposes with your consent.
    </p>
    <ul>
      <li>To deliver and facilitate delivery of services to the user.</li>
      <li>To respond to user inquiries and offer support to users.</li>
      <li>To send administrative information to you.</li>
      <li>To request feedback.</li>
      <li>To protect our Services.</li>
      <li>To identify usage trends.</li>
      <li>To save or protect an individual&apos;s vital interest.</li>
    </ul>

    <h2>3. What legal bases do we rely on to process your information?</h2>
    <p>
      <em>In short:</em> We only process your personal information when we
      believe it is necessary and we have a valid legal reason to do so under
      applicable law.
    </p>
    <p>
      <strong>If you are located in the EU or UK,</strong> the GDPR and UK GDPR
      require us to explain the valid legal bases we rely on. We may rely on
      the following:
    </p>
    <ul>
      <li>
        <strong>Consent.</strong> You may withdraw your consent at any time.
      </li>
      <li>
        <strong>Performance of a contract.</strong>
      </li>
      <li>
        <strong>Legitimate interests</strong> — for example, analysing how our
        Services are used so we can improve them, supporting our marketing
        activities, diagnosing problems, and understanding how users interact.
      </li>
      <li>
        <strong>Legal obligations.</strong>
      </li>
      <li>
        <strong>Vital interests.</strong>
      </li>
    </ul>

    <h2>4. When and with whom do we share your personal information?</h2>
    <p>
      We may share data with third-party vendors, service providers,
      contractors or agents who perform services for us or on our behalf and
      require access to such information to do that work. Categories include:
    </p>
    <ul>
      <li>Cloud computing services</li>
      <li>Communication &amp; collaboration tools</li>
      <li>Data analytics services</li>
      <li>Data storage service providers</li>
      <li>Performance monitoring tools</li>
      <li>Product engineering &amp; design tools</li>
      <li>User account registration &amp; authentication services</li>
      <li>Website hosting service providers</li>
    </ul>
    <p>
      We also may share your personal information in connection with any
      merger, sale of company assets, financing, or acquisition of all or a
      portion of our business to another company.
    </p>

    <h2>5. Third-party websites</h2>
    <p>
      We are not responsible for the safety of any information that you share
      with third parties that we may link to but are not affiliated with. We
      cannot guarantee the safety and privacy of data you provide to any third
      parties; any data collected by third parties is not covered by this
      privacy notice.
    </p>

    <h2>6. International transfers</h2>
    <p>
      Our servers are located in France. If you are accessing our Services
      from outside France, please be aware that your information may be
      transferred to, stored, and processed by us and our third parties in
      France and other countries. We will take all necessary measures to
      protect your personal information in accordance with this notice and
      applicable law.
    </p>

    <h2>7. How long do we keep your information?</h2>
    <p>
      We keep your information for as long as necessary to fulfil the purposes
      outlined in this notice unless otherwise required by law. No purpose in
      this notice will require us to keep your personal information for longer
      than 6 months past the termination of the user&apos;s account.
    </p>

    <h2>8. How do we keep your information safe?</h2>
    <p>
      We have implemented appropriate and reasonable technical and
      organisational security measures designed to protect the security of any
      personal information we process. However, no electronic transmission can
      be guaranteed to be 100% secure, so transmission is at your own risk.
    </p>

    <h2>9. Do we collect information from minors?</h2>
    <p>
      We do not knowingly solicit data from or market to children under 18. If
      you become aware of any data we may have collected from children under
      18, please contact us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <h2>10. What are your privacy rights?</h2>
    <p>
      In some regions (EEA, UK, Switzerland, Canada, and certain US states) you
      have rights that allow you greater access to and control over your
      personal information, including the right to:
    </p>
    <ul>
      <li>Request access and obtain a copy of your personal information</li>
      <li>Request rectification or erasure</li>
      <li>Restrict the processing of your personal information</li>
      <li>Data portability, where applicable</li>
      <li>Not be subject to automated decision-making</li>
      <li>Object to the processing of your personal information</li>
    </ul>
    <p>
      You can make such a request by contacting us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>

    <h2>11. Controls for do-not-track features</h2>
    <p>
      Most web browsers include a Do-Not-Track (&ldquo;DNT&rdquo;) feature.
      Because no uniform standard has been finalised, we do not currently
      respond to DNT browser signals or any other mechanism that automatically
      communicates your choice not to be tracked online.
    </p>

    <h2>12. US state residents</h2>
    <p>
      If you are a resident of California, Colorado, Connecticut, Utah or
      Virginia, you are granted specific rights regarding access, correction,
      deletion, portability, and opting out of targeted advertising, sale, or
      profiling. We have not sold any personal data to third parties for
      business or commercial purposes, and we will not sell personal data
      belonging to website visitors, users, and other consumers in the future.
    </p>
    <p>
      To exercise these rights, contact us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If we decline to
      take action and you wish to appeal, please email the same address; we
      will respond within the timeframe required by your state&apos;s law.
    </p>

    <h2>13. Do we make updates to this notice?</h2>
    <p>
      We may update this privacy notice from time to time. The updated version
      will be indicated by an updated &ldquo;Revised&rdquo; date and will be
      effective as soon as it is accessible. If we make material changes, we
      may notify you either by prominently posting a notice or by directly
      sending you a notification.
    </p>

    <h2>14. How can you contact us?</h2>
    <p>
      If you have questions or comments about this notice, email us at{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or write to:
    </p>
    <p>Send Return B.V.</p>

    <h2>15. Review, update, or delete your data</h2>
    <p>
      Based on the applicable laws of your country, you may have the right to
      request access to the personal information we collect from you, change
      that information, or delete it. To submit a request, email{" "}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>
  </StaticPage>
);
