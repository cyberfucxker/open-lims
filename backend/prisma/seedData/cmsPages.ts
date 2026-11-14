/** Real, production-ready copy for the Superadmin CMS module's launch
 *  content — seeded (upserted, idempotent) by `prisma/seed.ts`. Written for
 *  Example Diagnostics Lab, a diagnostic lab & home-collection platform.
 *  Every page is seeded PUBLISHED so the public `/api/v1/cms/:appType/:slug`
 *  endpoint has real content from day one; admins can still unpublish/edit
 *  freely from the Superadmin CMS UI afterwards. */

export interface CmsPageSeed {
  appType: "USER" | "PHLEBO";
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
}

const CONTACT_EMAIL = "info@example.com";
const CONTACT_PHONE = "+91 90000 00000";
const CORPORATE_EMAIL = "corporate@example.com";

export const CMS_PAGE_SEEDS: CmsPageSeed[] = [
  // ============================= USER APP =============================
  {
    appType: "USER",
    slug: "about-us",
    title: "About Us",
    metaTitle: "About Us | Example Diagnostics Lab",
    metaDescription:
      "Learn about Example Diagnostics Lab — accurate lab testing, doorstep sample collection, and digital reports trusted by thousands of families.",
    content: `
<h1>About Example Diagnostics Lab</h1>
<p>Example Diagnostics Lab is a technology-driven diagnostic lab and home-collection platform built around a simple idea: accurate health testing should be easy to access, easy to understand, and easy to trust. From a single tap in our app to a certified professional at your doorstep, we bring the entire diagnostic journey — booking, sample collection, processing, and reporting — under one seamless, digitally connected experience.</p>

<h2>Our Story</h2>
<p>What started as a single diagnostic centre has grown into a city-spanning network of labs, collection centres, and trained phlebotomists, all connected through one digital platform. Every part of that growth has been guided by the same principle we started with: a diagnostic report is only useful if it is accurate, timely, and easy for a patient to act on. That principle still shapes every process, partnership, and product decision we make today.</p>

<h2>Our Mission</h2>
<p>To make quality diagnostics accessible to every household — through sound science, compassionate service, and technology that removes friction from healthcare, not adds to it.</p>

<h2>What We Offer</h2>
<ul>
<li><strong>Lab Tests</strong> — a comprehensive catalogue spanning routine blood work, specialised pathology, hormonal panels, and full-body health packages.</li>
<li><strong>Home Collection</strong> — trained, ID-verified phlebotomists visit your home or office at a time slot you choose, using sealed, single-use collection kits.</li>
<li><strong>Online Booking</strong> — browse tests and packages, compare prices, and confirm your appointment in the app in under a minute.</li>
<li><strong>Digital Reports</strong> — reports are delivered straight to your account as soon as they clear our quality checks, with historical results always available for comparison.</li>
<li><strong>Corporate Health Packages</strong> — annual checkup programs, onsite collection drives, and dedicated account management for organisations of any size.</li>
</ul>

<h2>Our Commitment to Quality</h2>
<p>Every sample collected on our platform moves through a chain-of-custody process designed to protect its integrity from the moment of collection to the moment a result is generated. Our lab partners follow standardised testing protocols, multi-level internal quality control, and calibrated equipment maintenance schedules, so that the number you see on your report is one you and your doctor can rely on.</p>

<h2>Why Choose Example Diagnostics Lab</h2>
<ul>
<li>Verified, trained, and background-checked home-collection staff</li>
<li>Transparent, upfront pricing with no hidden charges</li>
<li>Flexible scheduling, including early morning and weekend slots</li>
<li>Secure digital storage of every report you have ever taken with us</li>
<li>Dedicated customer support for booking, rescheduling, and report queries</li>
</ul>

<p>Whether you are booking a single routine test or managing your family's annual checkups, Example Diagnostics Lab is built to make the process simple, transparent, and stress-free — because your health deserves nothing less.</p>`,
  },
  {
    appType: "USER",
    slug: "privacy-policy",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy | Example Diagnostics Lab",
    metaDescription:
      "Read how Example Diagnostics Lab collects, uses, protects and shares your personal and health information across our app and website.",
    content: `
<h1>Privacy Policy</h1>
<p>Example Diagnostics Lab ("we", "us", or "our") is committed to protecting the privacy and confidentiality of every user of our mobile application, website, and related services (together, the "Platform"). This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices available to you.</p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly, information generated through your use of the Platform, and information necessary to deliver diagnostic services safely and accurately.</p>
<ul>
<li><strong>Account & Contact Information</strong> — name, mobile number, email address, date of birth, gender, and address(es) for sample collection.</li>
<li><strong>Health & Test Information</strong> — the tests and packages you book, sample collection details, lab results, and report history.</li>
<li><strong>Payment Information</strong> — transaction records for bookings; card and UPI details are processed by our licensed payment gateway partners and are never stored on our servers.</li>
<li><strong>Device & Usage Information</strong> — app version, device type, IP address, and general usage patterns, used to maintain and improve the Platform.</li>
<li><strong>Location Information</strong> — collected only where required to schedule and route your home-collection appointment.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
<li>To create and manage your account, and process test bookings and orders</li>
<li>To coordinate home sample collection, including assigning and routing phlebotomists</li>
<li>To generate, store, and deliver your diagnostic reports</li>
<li>To process payments, refunds, and wallet transactions</li>
<li>To send booking confirmations, reminders, report-ready alerts, and service updates</li>
<li>To respond to customer support requests and resolve complaints</li>
<li>To improve our services, detect fraud, and maintain platform security</li>
</ul>

<h2>3. Health Data & Confidentiality</h2>
<p>Your health and test data is treated with the highest degree of confidentiality. Access to your reports and health records is restricted to authorised laboratory personnel, your treating physician (where shared by you), and the customer support team handling your specific query. Health data is never sold, rented, or used for advertising purposes.</p>

<h2>4. Data Sharing &amp; Disclosure</h2>
<p>We do not sell your personal or health information. We may share limited information strictly as necessary with:</p>
<ul>
<li>Accredited laboratory and diagnostic partners processing your samples</li>
<li>Verified phlebotomists assigned to your home-collection appointment (name, address, and contact number only)</li>
<li>Licensed payment gateway providers, to process transactions securely</li>
<li>Government or regulatory authorities, where required by applicable law</li>
</ul>

<h2>5. Data Security</h2>
<p>We use industry-standard technical and organisational safeguards — including encryption in transit, access controls, and restricted internal permissions — to protect your information from unauthorised access, alteration, or disclosure. While no system can guarantee absolute security, we continuously review and strengthen our safeguards.</p>

<h2>6. Cookies &amp; Tracking Technologies</h2>
<p>Our website and app may use cookies and similar technologies to remember your preferences, keep you signed in, and understand how our Platform is used. You can control cookie preferences through your browser or device settings.</p>

<h2>7. Your Rights &amp; Choices</h2>
<ul>
<li>Access and review the personal information we hold about you</li>
<li>Request correction of inaccurate or outdated information</li>
<li>Request deletion of your account, subject to record-keeping obligations under applicable law</li>
<li>Opt out of promotional communications at any time</li>
</ul>

<h2>8. Data Retention</h2>
<p>We retain personal and health information for as long as your account remains active, and thereafter for the period required to meet legal, regulatory, and medical record-keeping obligations under applicable Indian law.</p>

<h2>9. Children's Privacy</h2>
<p>Bookings for minors must be made by a parent or legal guardian through their own registered account. We do not knowingly collect personal information directly from children without such supervision.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Material changes will be notified through the app or our website, along with the "last updated" date.</p>

<h2>11. Contact Us</h2>
<p>For any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us at <strong>${CONTACT_EMAIL}</strong> or <strong>${CONTACT_PHONE}</strong>.</p>`,
  },
  {
    appType: "USER",
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    metaTitle: "Terms & Conditions | Example Diagnostics Lab",
    metaDescription:
      "Review the terms and conditions governing bookings, payments, cancellations and report delivery on the Example Diagnostics Lab platform.",
    content: `
<h1>Terms &amp; Conditions</h1>
<p>These Terms &amp; Conditions ("Terms") govern your access to and use of the Example Diagnostics Lab mobile application, website, and related services (together, the "Platform"), operated by Example Diagnostics Lab ("we", "us"). By creating an account or booking a service through the Platform, you agree to be bound by these Terms.</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using the Platform, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy. If you do not agree, please discontinue use of the Platform.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years of age to create an account. Bookings for minors, elderly family members, or other dependents must be made by an adult through their own account, who accepts responsibility for the accuracy of the information provided.</p>

<h2>3. Description of Services</h2>
<p>Example Diagnostics Lab facilitates booking of diagnostic lab tests and health packages, including doorstep sample collection, laboratory processing, and digital report delivery. Services are fulfilled through our own facilities and/or accredited laboratory and collection partners.</p>

<h2>4. Booking &amp; Scheduling</h2>
<ul>
<li>Bookings must include accurate patient details, address, and preferred time slot.</li>
<li>Slot availability is subject to service area, phlebotomist availability, and fasting/test-specific requirements.</li>
<li>You are responsible for following any pre-test instructions (such as fasting) communicated at the time of booking.</li>
<li>Rescheduling is permitted subject to slot availability, generally up to a defined cut-off before the scheduled visit as shown in the app.</li>
</ul>

<h2>5. User Responsibilities</h2>
<ul>
<li>Provide true, accurate, and complete information at the time of booking</li>
<li>Ensure the patient is present, reasonably prepared (e.g. fasting where required), and available at the scheduled address and time</li>
<li>Treat our phlebotomists and staff with courtesy and respect</li>
<li>Not misuse the Platform for any unlawful, fraudulent, or abusive purpose</li>
</ul>

<h2>6. Payments &amp; Pricing</h2>
<p>All prices displayed on the Platform are inclusive of applicable taxes unless stated otherwise. Payment can be made online at the time of booking or, where offered, in cash at the time of sample collection. We reserve the right to revise pricing at any time; the price applicable is the one confirmed at the time of your booking.</p>

<h2>7. Cancellations &amp; Rescheduling</h2>
<p>You may cancel or reschedule a booking free of charge up to the cut-off period displayed in the app before your scheduled slot. Cancellations after sample collection has occurred are governed by our <a href="/refund-policy">Refund Policy</a>.</p>

<h2>8. Reports &amp; Turnaround Time</h2>
<p>Estimated report turnaround times are indicative and displayed against each test at the time of booking. Turnaround may occasionally be affected by factors outside our control, such as sample quality, retesting requirements, or logistics delays. We will notify you of any material delay.</p>

<h2>9. Limitation of Liability</h2>
<p>While we take extensive quality-control measures, diagnostic testing is subject to inherent biological and clinical variability. Reports are intended to support, not replace, professional medical judgment. To the maximum extent permitted by law, Example Diagnostics Lab's liability arising from use of the Platform shall be limited to the amount paid for the specific service giving rise to the claim.</p>

<h2>10. Prohibited Uses</h2>
<p>You agree not to: misuse or attempt to gain unauthorised access to the Platform; submit false patient or health information; resell or commercially exploit our services without written authorisation; or engage in any conduct that endangers the safety of our staff.</p>

<h2>11. Intellectual Property</h2>
<p>All content, trademarks, logos, and software associated with the Platform are the property of Example Diagnostics Lab or its licensors and may not be copied, reproduced, or used without prior written consent.</p>

<h2>12. Indemnification</h2>
<p>You agree to indemnify and hold Example Diagnostics Lab harmless from any claims, losses, or damages arising from your misuse of the Platform or breach of these Terms.</p>

<h2>13. Governing Law &amp; Jurisdiction</h2>
<p>These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts at the location of our registered office.</p>

<h2>14. Amendments</h2>
<p>We may update these Terms periodically to reflect changes in our services or legal obligations. Continued use of the Platform after such updates constitutes acceptance of the revised Terms.</p>

<h2>15. Contact Us</h2>
<p>For questions about these Terms, please reach out to us at <strong>${CONTACT_EMAIL}</strong> or <strong>${CONTACT_PHONE}</strong>.</p>`,
  },
  {
    appType: "USER",
    slug: "refund-policy",
    title: "Refund Policy",
    metaTitle: "Refund Policy | Example Diagnostics Lab",
    metaDescription:
      "Understand when and how refunds are processed for cancelled orders, failed samples, and rescheduled appointments at Example Diagnostics Lab.",
    content: `
<h1>Refund Policy</h1>
<p>We want every booking on Example Diagnostics Lab to go smoothly. When it doesn't, this policy explains exactly when you're eligible for a refund, how much you'll receive, and how long it takes.</p>

<h2>1. Overview</h2>
<p>Refunds are evaluated based on the stage at which a booking is cancelled — before sample collection, after sample collection, or due to a sample or reporting issue on our end.</p>

<h2>2. Cancellation Before Sample Collection</h2>
<p>If you cancel your booking before our phlebotomist has collected the sample, you are eligible for a <strong>100% refund</strong> of the amount paid online. Refunds are processed automatically once the cancellation is confirmed in the app.</p>

<h2>3. Cancellation After Sample Collection</h2>
<p>Once a sample has been collected, the booking enters processing and is generally not eligible for cancellation, as laboratory resources have already been committed. Exceptions are made where the sample cannot be processed due to a quality issue (see Section 4).</p>

<h2>4. Failed or Rejected Samples</h2>
<p>If a sample is rejected by the laboratory due to a collection or handling issue (for example, haemolysis, insufficient quantity, or clotting), you will not be charged for the affected test. If payment was already made, the corresponding amount will be refunded in full, and we will offer a complimentary recollection wherever medically appropriate.</p>

<h2>5. Phlebotomist No-Show or Missed Slot</h2>
<p>If our assigned phlebotomist fails to arrive within the scheduled slot without prior communication, you are entitled to a full refund or a free priority rescheduling, whichever you prefer.</p>

<h2>6. Refund Timelines &amp; Mode</h2>
<ul>
<li>Refunds to the original payment method (card/UPI/net banking) are processed within <strong>5–7 business days</strong>, subject to your bank's processing timelines.</li>
<li>Refunds to your Wallet are credited <strong>instantly</strong> upon approval and can be used for any future booking.</li>
<li>Cash payments collected at the time of service are refunded via bank transfer or wallet credit, as chosen by you.</li>
</ul>

<h2>7. Non-Refundable Cases</h2>
<ul>
<li>Cancellations requested after the sample has been successfully collected and accepted by the lab</li>
<li>Incorrect information provided by the customer (e.g. wrong address or unavailability at the scheduled time without prior cancellation) resulting in a missed visit</li>
<li>Promotional or discounted amounts where the offer terms explicitly state non-refundability</li>
</ul>

<h2>8. Wallet Credit Option</h2>
<p>You may choose to receive any eligible refund as an instant Wallet credit instead of a bank refund. Wallet credits do not expire and can be used towards any future test, package, or corporate booking on the Platform.</p>

<h2>9. How to Request a Refund</h2>
<p>Refund requests can be raised directly from the <strong>Orders</strong> section of the app, or by contacting our support team with your order number. Our team will review the request and confirm the outcome within 24–48 hours.</p>

<h2>10. Contact Us</h2>
<p>For any refund-related query, write to us at <strong>${CONTACT_EMAIL}</strong> or call <strong>${CONTACT_PHONE}</strong>.</p>`,
  },
  {
    appType: "USER",
    slug: "faqs",
    title: "FAQs",
    metaTitle: "Frequently Asked Questions | Example Diagnostics Lab",
    metaDescription:
      "Answers to common questions about booking, home sample collection, reports, payments and refunds on Example Diagnostics Lab.",
    content: `
<h1>Frequently Asked Questions</h1>
<p>Find quick answers to the most common questions about booking tests, home sample collection, reports, and payments.</p>

<h2>Booking &amp; Scheduling</h2>
<h3>How do I book a test on Example Diagnostics Lab?</h3>
<p>Open the app, search for the test or package you need, add it to your cart, choose your address and a convenient time slot, and confirm your booking. You'll receive an instant confirmation.</p>
<h3>Can I book tests for a family member?</h3>
<p>Yes. You can add family members' profiles to your account and book tests for any of them from a single login.</p>
<h3>What time slots are available for home collection?</h3>
<p>We offer slots from early morning through evening, seven days a week, subject to availability in your area.</p>
<h3>Can I book multiple tests in a single visit?</h3>
<p>Yes, you can add multiple tests or packages to the same cart, and our phlebotomist will collect all required samples in a single visit.</p>
<h3>Do I need to fast before my test?</h3>
<p>Fasting requirements, if any, are shown clearly on the test details page and in your booking confirmation.</p>

<h2>Sample Collection</h2>
<h3>How do I reschedule my appointment?</h3>
<p>You can reschedule from the <strong>Orders</strong> tab up to the cut-off time shown for your booking, typically a few hours before your slot.</p>
<h3>Who collects my sample?</h3>
<p>A trained, ID-verified phlebotomist from our network visits your address at the scheduled time using sealed, single-use collection equipment.</p>
<h3>Is home sample collection safe and hygienic?</h3>
<p>Yes. All our phlebotomists follow strict hygiene protocols, use fresh PPE and sealed collection kits for every visit, and dispose of biomedical waste as per regulatory guidelines.</p>
<h3>What if I'm not available at the scheduled time?</h3>
<p>Please reschedule in advance through the app. If you miss your slot without rescheduling, you may need to book a new appointment.</p>
<h3>Can I request a specific gender for the phlebotomist?</h3>
<p>Wherever possible, we try to accommodate gender preferences for home visits — you can note this in the special instructions field while booking.</p>
<h3>Is there an extra charge for home collection?</h3>
<p>A nominal phlebotomy/home-visit charge may apply depending on your city and order value; this is always shown transparently before you confirm your booking.</p>

<h2>Reports</h2>
<h3>How will I receive my report?</h3>
<p>Your report is uploaded to the app as a secure digital PDF as soon as it clears our quality checks. You'll receive a notification the moment it's ready.</p>
<h3>How long does it take to get my report?</h3>
<p>Turnaround time varies by test and is shown on the test details page — most routine tests are reported within 24 hours of sample collection.</p>
<h3>Can I access my old reports?</h3>
<p>Yes, all your past reports remain securely stored in the app under <strong>My Reports</strong>, accessible any time.</p>
<h3>Can I share my report with my doctor directly from the app?</h3>
<p>Yes, reports can be downloaded or shared as a PDF directly from the app.</p>
<h3>What do I do if my report seems delayed?</h3>
<p>If your report is delayed beyond the estimated turnaround time, please contact support with your order number and we'll investigate immediately.</p>
<h3>Can I get a physical printed copy of my report?</h3>
<p>Digital reports are the default and fastest option; printed copies can be requested through customer support where required.</p>

<h2>Payments &amp; Refunds</h2>
<h3>What payment methods are accepted?</h3>
<p>We accept UPI, debit/credit cards, net banking, and cash on delivery in select service areas, in addition to Wallet balance.</p>
<h3>Is it safe to pay online through the app?</h3>
<p>Yes, all online payments are processed through licensed, PCI-DSS compliant payment gateway partners — we never store your card details.</p>
<h3>How do refunds work if I cancel my order?</h3>
<p>Refunds for eligible cancellations are processed to your original payment method within 5–7 business days, or instantly if credited to your Wallet. See our <a href="/refund-policy">Refund Policy</a> for full details.</p>
<h3>What is the Wallet?</h3>
<p>The Wallet stores refunds and promotional credits that can be used towards any future booking on the app.</p>
<h3>Can I use a coupon code on my order?</h3>
<p>Yes, applicable coupon codes can be entered at checkout and the discount will be reflected instantly in your order total.</p>

<h2>Corporate &amp; General</h2>
<h3>Does Example Diagnostics Lab offer corporate health checkups?</h3>
<p>Yes, our <a href="/corporate-wellness-program">Corporate Wellness Program</a> offers annual health packages, onsite collection drives, and dedicated account management for organisations of any size.</p>
<h3>Which cities do you currently operate in?</h3>
<p>We are continuously expanding our service network — available cities and serviceable pin codes are shown when you enter your address while booking.</p>
<h3>How do I contact customer support?</h3>
<p>You can reach our support team from the <strong>Help</strong> section in the app, or via email/phone listed on our <a href="/about-us">About Us</a> page.</p>
<h3>How do I delete my account?</h3>
<p>You can request account deletion from the app settings or by contacting support; please see our Privacy Policy for details on data retention after account deletion.</p>`,
  },
  {
    appType: "USER",
    slug: "corporate-wellness-program",
    title: "Corporate Wellness Program",
    metaTitle: "Corporate Wellness Program | Example Diagnostics Lab",
    metaDescription:
      "Employee health checkups, annual wellness packages, onsite sample collection and a dedicated relationship manager — for organisations of any size.",
    content: `
<h1>Corporate Wellness Program</h1>
<p>A healthy workforce is a productive workforce. Example Diagnostics Lab's Corporate Wellness Program partners with organisations to make preventive health screening a simple, recurring part of employee wellbeing — delivered directly to your office, with zero disruption to the workday.</p>

<h2>Employee Health Checkups</h2>
<p>We design comprehensive health checkup programs covering routine screenings, lifestyle-disease risk panels, and specialist diagnostics — tailored to your employees' age groups, roles, and health risk profiles. Every employee receives a private, confidential health report and easy access to trend their results year over year.</p>

<h2>Annual Health Packages</h2>
<p>Our annual wellness packages are built for recurring, organisation-wide screening cycles, so your health benefit becomes a dependable yearly ritual rather than a one-off event. Packages can be bundled with your existing employee benefits program and scaled up or down as your headcount changes.</p>

<table>
<thead>
<tr><th>Package Tier</th><th>Ideal For</th><th>Coverage Highlights</th></tr>
</thead>
<tbody>
<tr><td><strong>Essential</strong></td><td>Entry-level annual screening</td><td>CBC, blood sugar, lipid profile, liver &amp; kidney function, urine routine</td></tr>
<tr><td><strong>Advantage</strong></td><td>Comprehensive yearly checkup</td><td>Essential panel + thyroid profile, HbA1c, vitamin D &amp; B12, ECG</td></tr>
<tr><td><strong>Premier</strong></td><td>Leadership &amp; senior staff</td><td>Advantage panel + cardiac risk markers, tumour markers, whole-body imaging add-ons</td></tr>
</tbody>
</table>

<h2>Onsite Sample Collection</h2>
<p>Our phlebotomy teams can run dedicated collection drives directly at your office premises on a scheduled day, minimising employee downtime. For distributed or remote teams, we combine onsite drives with individual home-collection slots so no employee is left out, regardless of location.</p>

<h2>Custom Packages</h2>
<p>Every organisation's workforce is different. We work with your HR or admin team to design custom test panels aligned to your industry, employee demographics, and budget — from a focused screening panel for a small team to a multi-tier program spanning thousands of employees across multiple cities.</p>

<h2>Dedicated Relationship Manager</h2>
<p>Every corporate account is assigned a dedicated Relationship Manager who serves as your single point of contact — coordinating scheduling, resolving employee queries, managing invoicing, and ensuring every drive runs smoothly from planning to report delivery.</p>

<h2>Reporting Dashboard</h2>
<p>HR and admin teams get access to a consolidated reporting dashboard showing screening completion rates, participation trends, and anonymised, aggregate health insights across the organisation — helping you measure the impact of your wellness investment while keeping individual employee health data strictly confidential.</p>

<h2>Appointment Scheduling</h2>
<p>Employees can book their individual slots directly through a dedicated corporate booking link or the Example Lab app, choosing a time that fits their schedule. Our system automatically manages capacity across onsite drives and home-collection slots to avoid overbooking.</p>

<h2>Contact Information</h2>
<p>To set up a Corporate Wellness Program for your organisation, reach out to our Corporate Desk:</p>
<ul>
<li>Email: <strong>${CORPORATE_EMAIL}</strong></li>
<li>Phone: <strong>${CONTACT_PHONE}</strong></li>
</ul>
<p>Our team will get in touch within one business day to understand your requirements and propose a program tailored to your organisation.</p>`,
  },

  // ============================ PHLEBO APP =============================
  {
    appType: "PHLEBO",
    slug: "about-us",
    title: "About Us",
    metaTitle: "About Us | Example Diagnostics Lab Phlebo Partner App",
    metaDescription:
      "Example Diagnostics Lab's Phlebo App empowers sample collection executives with job assignment, navigation, earnings tracking and support tools.",
    content: `
<h1>About Example Diagnostics Lab — Phlebo Partner Program</h1>
<p>Example Diagnostics Lab's home-collection network runs on the professionalism and dedication of our Phlebos — the trained sample collection executives who represent us at the patient's doorstep every single day. The Phlebo App is built specifically to support you: your assignments, your route, your earnings, and your growth.</p>

<h2>Who We Are</h2>
<p>We are a diagnostic lab and home-collection platform connecting patients to accurate, dependable testing — and Phlebos are the most important link in that chain. Every sample you collect represents someone's health decision, and we've built our entire field operations program around giving you the tools, training, and support to do that job with confidence.</p>

<h2>What the Phlebo App Gives You</h2>
<ul>
<li><strong>Job Assignment</strong> — see your assigned visits for the day, with patient details, address, and test requirements in one place.</li>
<li><strong>Navigation Support</strong> — in-app route guidance to reach each patient's address efficiently.</li>
<li><strong>Earnings Tracking</strong> — a transparent, real-time view of your per-visit earnings, incentives, and payment history.</li>
<li><strong>Digital Service PIN Verification</strong> — a secure way to confirm you've reached the right patient before collection.</li>
<li><strong>Direct Support Access</strong> — raise queries or escalate issues straight from the app, without waiting on hold.</li>
</ul>

<h2>Our Commitment to You</h2>
<p>We are committed to fair, transparent earnings, timely payments, ongoing training, and a support system that actually resolves your issues — because a well-supported Phlebo is what makes dependable home collection possible in the first place.</p>

<h2>Growing Together</h2>
<p>As our service network expands into new cities and neighbourhoods, so does the opportunity for our Phlebo partners. We continually invest in better tools, clearer processes, and stronger field support so that this platform grows as a place where skilled sample collection professionals can build a dependable, respected career.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "privacy-policy",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy | Example Diagnostics Lab Phlebo App",
    metaDescription:
      "How Example Diagnostics Lab collects, uses and protects Phlebo partner data including KYC, location, attendance and payout information.",
    content: `
<h1>Privacy Policy — Phlebo App</h1>
<p>This Privacy Policy explains how Example Diagnostics Lab ("we", "us") collects, uses, and protects the personal information of Phlebo partners using our Phlebo mobile application ("Phlebo App").</p>

<h2>1. Information We Collect</h2>
<ul>
<li><strong>Identity &amp; KYC Information</strong> — name, contact details, address, government ID, and verification documents submitted during onboarding.</li>
<li><strong>Bank &amp; Payout Information</strong> — bank account or UPI details used to process your earnings and incentive payments.</li>
<li><strong>Location Data</strong> — collected during active duty hours to enable job assignment, route navigation, and visit verification.</li>
<li><strong>Attendance &amp; Job Data</strong> — check-in/check-out times, assigned visits, service PIN verifications, and completion status.</li>
<li><strong>Device &amp; App Usage Data</strong> — device type, app version, and usage logs, used for troubleshooting and service improvement.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
<li>To verify your identity and onboard you onto the platform</li>
<li>To assign, route, and track home-collection visits</li>
<li>To calculate and process your earnings and incentive payments accurately</li>
<li>To monitor attendance, performance, and service quality</li>
<li>To provide support and resolve escalations raised by you or patients</li>
<li>To comply with applicable legal and regulatory requirements</li>
</ul>

<h2>3. Location Data Usage</h2>
<p>Location data is used strictly for operational purposes — assigning nearby jobs, providing turn-by-turn navigation, and confirming that a visit was completed at the correct address. Location tracking is limited to your active duty status within the app.</p>

<h2>4. Data Sharing &amp; Disclosure</h2>
<p>We do not sell your personal information. Limited information is shared only as necessary with:</p>
<ul>
<li>Patients, for the purpose of identifying the assigned Phlebo for their visit (name and photo only)</li>
<li>Banking/payment partners, to process your payouts</li>
<li>Government or regulatory authorities, where required by applicable law</li>
</ul>

<h2>5. Data Security</h2>
<p>We apply encryption, access controls, and restricted internal permissions to protect your personal, financial, and location data from unauthorised access or misuse.</p>

<h2>6. Data Retention</h2>
<p>Your information is retained for as long as your Phlebo account remains active, and thereafter for the period required to meet statutory record-keeping, tax, and compliance obligations.</p>

<h2>7. Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data (subject to applicable legal retention requirements) by contacting our Phlebo Support team through the app.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this Privacy Policy periodically. Material changes will be communicated through the Phlebo App.</p>

<h2>9. Contact Us</h2>
<p>For any privacy-related questions, please reach out via the <strong>Help &amp; Support</strong> section of the Phlebo App or write to us at <strong>${CONTACT_EMAIL}</strong>.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    metaTitle: "Terms & Conditions | Example Diagnostics Lab Phlebo App",
    metaDescription:
      "Terms governing Phlebo partner use of the Example Diagnostics Lab Phlebo App, including job assignment, conduct, payments and termination.",
    content: `
<h1>Terms &amp; Conditions — Phlebo App</h1>
<p>These Terms &amp; Conditions govern your access to and use of the Example Diagnostics Lab Phlebo App ("Phlebo App") as a registered sample collection partner ("Phlebo", "you"). By logging in and accepting job assignments through the Phlebo App, you agree to these Terms in addition to your separate engagement agreement with Example Diagnostics Lab.</p>

<h2>1. Eligibility &amp; Onboarding</h2>
<p>Access to the Phlebo App is available only to individuals who have completed Example Diagnostics Lab's onboarding process, including identity verification, training, and any applicable certification requirements.</p>

<h2>2. Nature of Engagement</h2>
<p>Your relationship with Example Diagnostics Lab is governed by your separate engagement/partnership agreement. Nothing in these Terms shall be construed as creating an employment relationship; the Phlebo App is a operational tool provided to support the performance of your engagement.</p>

<h2>3. App Usage Obligations</h2>
<ul>
<li>Keep your availability status accurate and up to date</li>
<li>Accept, complete, and update the status of assigned visits promptly and honestly</li>
<li>Use the in-app service PIN verification for every visit, without exception</li>
<li>Report any technical issues or discrepancies to Phlebo Support immediately</li>
</ul>

<h2>4. Professional Conduct</h2>
<p>You are required to conduct every visit in accordance with our <a href="/phlebo/guidelines">Phlebo Guidelines</a> and <a href="/phlebo/code-of-conduct">Code of Conduct</a>, including grooming standards, hygiene protocols, PPE usage, and respectful patient interaction at all times.</p>

<h2>5. Sample Handling Responsibility</h2>
<p>You are responsible for following the correct sample collection SOP, correct labelling, safe transport, and proper biomedical waste disposal for every visit, as detailed in our Phlebo Guidelines.</p>

<h2>6. Payments</h2>
<p>Earnings are calculated and disbursed as described in our <a href="/phlebo/earnings-payments">Earnings &amp; Payments</a> page. Payment amounts are subject to accurate visit completion and any applicable deductions disclosed to you.</p>

<h2>7. Data Privacy</h2>
<p>You must handle all patient information accessed through the Phlebo App — including names, addresses, and health-related details — as strictly confidential, and must never share, copy, or disclose such information outside the scope of performing your assigned visit.</p>

<h2>8. Suspension &amp; Termination</h2>
<p>Example Diagnostics Lab reserves the right to suspend or terminate Phlebo App access in cases of policy violations, repeated service quality issues, safety concerns, or breach of the Code of Conduct, in accordance with your engagement agreement.</p>

<h2>9. Limitation of Liability</h2>
<p>Example Diagnostics Lab's liability in connection with the Phlebo App is limited to the extent permitted under your engagement agreement and applicable law.</p>

<h2>10. Governing Law</h2>
<p>These Terms are governed by the laws of India, and any disputes shall be subject to the jurisdiction of the courts at the location of our registered office.</p>

<h2>11. Amendments</h2>
<p>We may update these Terms from time to time; continued use of the Phlebo App after such updates constitutes your acceptance of the revised Terms.</p>

<h2>12. Contact Us</h2>
<p>For questions about these Terms, contact Phlebo Support through the app or write to <strong>${CONTACT_EMAIL}</strong>.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "faqs",
    title: "FAQs",
    metaTitle: "Frequently Asked Questions | Example Diagnostics Lab Phlebo App",
    metaDescription:
      "Answers to common questions Phlebos have about onboarding, job assignment, sample handling, earnings, attendance and support.",
    content: `
<h1>Frequently Asked Questions — Phlebo App</h1>
<p>Quick answers to the questions our Phlebo partners ask most often.</p>

<h2>Onboarding</h2>
<h3>How do I get started as a Phlebo partner?</h3>
<p>Complete your registration and KYC verification through our onboarding team, finish the required training module, and your Phlebo App access will be activated.</p>
<h3>What documents are required for onboarding?</h3>
<p>A valid government ID, address proof, relevant phlebotomy/paramedical certification (where applicable), and bank account details for payouts.</p>
<h3>Is training provided before I start taking assignments?</h3>
<p>Yes, all Phlebos complete a mandatory training and orientation covering our collection SOP, hygiene protocols, and app usage before their first assignment.</p>

<h2>Job Assignment</h2>
<h3>How do I receive my daily job assignments?</h3>
<p>Assignments appear automatically in the Phlebo App based on your service area and availability status — simply mark yourself "Available" to start receiving jobs.</p>
<h3>Can I decline a job assignment?</h3>
<p>Assignments should generally be accepted once assigned; if you're genuinely unable to complete one, decline as early as possible through the app so it can be reassigned promptly.</p>
<h3>What if a patient is not available at the scheduled time?</h3>
<p>Wait for a reasonable time as per policy, attempt to contact the patient through the app, and mark the visit status accordingly if they remain unavailable.</p>
<h3>How do I navigate to the patient's address?</h3>
<p>Tap on the assigned visit to open in-app navigation, which routes you directly to the registered address.</p>
<h3>What is the service PIN and why is it required?</h3>
<p>The service PIN is a one-time code confirmed with the patient at the visit — it verifies you've reached the correct patient before sample collection begins.</p>

<h2>Sample Collection</h2>
<h3>What should I do if a sample collection fails?</h3>
<p>Follow the re-attempt protocol described in our Phlebo Guidelines, inform the patient calmly, and update the visit status with the reason in the app.</p>
<h3>How should I label and transport collected samples?</h3>
<p>Every sample must be labelled immediately after collection as per our Sample Collection SOP and transported in the provided cold-chain kit to the nearest collection point within the specified time window.</p>
<h3>What PPE am I required to wear during a visit?</h3>
<p>Gloves are mandatory for every collection, along with a mask and any additional PPE specified in our Phlebo Guidelines based on current protocols.</p>
<h3>How do I dispose of used needles and biomedical waste?</h3>
<p>All sharps and biomedical waste must be disposed of in the designated puncture-proof containers provided to you, following our Bio-Medical Waste guidelines — never in regular household or public bins.</p>

<h2>Earnings &amp; Payments</h2>
<h3>How are my earnings calculated?</h3>
<p>Earnings are calculated per completed visit, plus applicable incentives, as detailed on our <a href="/phlebo/earnings-payments">Earnings &amp; Payments</a> page.</p>
<h3>When do I receive my payments?</h3>
<p>Payments are disbursed on a fixed periodic cycle directly to your registered bank account — exact schedule is detailed on our Earnings &amp; Payments page.</p>
<h3>Where can I view my earnings history?</h3>
<p>Your complete earnings and payout history is available under the <strong>Earnings</strong> section of the Phlebo App at all times.</p>
<h3>Who do I contact if a payment seems incorrect?</h3>
<p>Raise a payment query directly from the Earnings section in the app, and our support team will review and respond within the stated resolution time.</p>

<h2>Attendance &amp; Support</h2>
<h3>How do I mark my attendance for the day?</h3>
<p>Attendance is marked automatically when you set your status to "Available" and begin accepting assignments for the day.</p>
<h3>What if I need to take leave?</h3>
<p>Update your availability status in advance through the app so no jobs are assigned to you during your time off.</p>
<h3>How do I escalate an emergency during a visit?</h3>
<p>Use the emergency escalation option in the app to alert our support team immediately, as outlined in our Phlebo Guidelines.</p>
<h3>How do I reach Phlebo Support for any other issue?</h3>
<p>The <strong>Help &amp; Support</strong> section in the app connects you directly with our Phlebo Support team for any operational, technical, or payment-related query.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "guidelines",
    title: "Phlebo Guidelines",
    metaTitle: "Phlebo Guidelines | Example Diagnostics Lab",
    metaDescription:
      "Grooming, sample collection SOP, hygiene, PPE, biomedical waste, emergency escalation, data privacy, attendance and ethics for Phlebo partners.",
    content: `
<h1>Phlebo Guidelines</h1>
<p>These guidelines set the standard for every home-collection visit performed under the Example Diagnostics Lab name. They exist to protect patients, protect you, and protect the accuracy of every sample collected. Every Phlebo is expected to know and follow these guidelines on every single visit.</p>

<h2>1. Grooming Standards</h2>
<ul>
<li>Wear your official Example Diagnostics Lab uniform and ID badge, visible at all times during a visit</li>
<li>Maintain clean, trimmed nails and tied-back hair for hygiene and professionalism</li>
<li>Footwear should be closed and appropriate for fieldwork</li>
<li>Carry your collection kit bag in clean, presentable condition</li>
</ul>

<h2>2. Sample Collection SOP</h2>
<ul>
<li>Verify the patient's identity and confirm the service PIN before beginning collection</li>
<li>Confirm fasting status and any special instructions relevant to the ordered tests</li>
<li>Perform hand hygiene and glove change before every single patient</li>
<li>Use only sealed, single-use collection equipment issued by Example Diagnostics Lab</li>
<li>Label every sample tube immediately after draw, in front of the patient, matching the patient ID</li>
<li>Pack samples into the cold-chain kit as per the required temperature for each test type</li>
<li>Transport and hand over samples to the designated collection point within the specified time window</li>
</ul>

<h2>3. Patient Behaviour &amp; Interaction</h2>
<ul>
<li>Greet every patient courteously and explain the collection process briefly before starting</li>
<li>Be patient with elderly patients, children, or anyone anxious about the procedure</li>
<li>Never rush a patient or skip the identity/PIN verification step under any circumstance</li>
<li>Escalate immediately, without confrontation, if a patient behaves inappropriately or unsafely</li>
</ul>

<h2>4. Hygiene Protocols</h2>
<ul>
<li>Sanitise hands before and after every patient interaction</li>
<li>Never reuse gloves, needles, or any single-use item across patients</li>
<li>Disinfect your equipment bag surface regularly through the day</li>
<li>Avoid visiting patients while personally unwell — report to your supervisor for reassignment instead</li>
</ul>

<h2>5. PPE Usage</h2>
<ul>
<li>Gloves are mandatory for every single collection, without exception</li>
<li>Wear a mask for every visit as per current protocol</li>
<li>Replace PPE immediately if damaged, soiled, or after each patient as applicable</li>
<li>Carry adequate spare PPE stock for your full day's assignments</li>
</ul>

<h2>6. Bio-Medical Waste Management</h2>
<ul>
<li>Dispose of used needles and sharps only in the designated puncture-proof sharps container</li>
<li>Segregate biomedical waste (sharps, gloves, cotton swabs) from regular waste at all times</li>
<li>Never dispose of biomedical waste in public bins, patient homes, or household waste</li>
<li>Hand over full waste containers to the collection centre for authorised disposal as per bio-medical waste regulations</li>
</ul>

<h2>7. Emergency Escalation</h2>
<ul>
<li>If a patient experiences a medical reaction (e.g. fainting, excessive bleeding) during or after collection, follow first-response protocol and use the in-app emergency escalation immediately</li>
<li>For personal safety concerns at a patient location, exit calmly and escalate through the app's emergency option</li>
<li>Always keep the Phlebo Support helpline accessible during duty hours</li>
</ul>

<h2>8. Data Privacy</h2>
<ul>
<li>Never share patient names, addresses, health details, or reports with anyone outside the scope of the visit</li>
<li>Do not photograph, screenshot, or retain any patient information beyond what's needed in the app</li>
<li>Report any accidental data exposure to Phlebo Support immediately</li>
</ul>

<h2>9. Attendance &amp; Punctuality</h2>
<ul>
<li>Mark your availability accurately at the start and end of your working hours</li>
<li>Arrive within the committed slot window for every assigned visit</li>
<li>Communicate delays proactively to the patient and update visit status in the app</li>
<li>Plan leaves in advance through the app to avoid unassigned or missed visits</li>
</ul>

<h2>10. Professional Ethics</h2>
<ul>
<li>Never accept or solicit additional payment from patients beyond the confirmed order amount</li>
<li>Represent Example Diagnostics Lab honestly — never make claims about tests or results you are not authorised to make</li>
<li>Report any conflict of interest, malpractice, or policy violation you observe</li>
<li>Uphold the same standard of professionalism whether or not you are being observed</li>
</ul>

<p>These guidelines apply to every visit, every day, without exception. For the full ethical standards expected of every Phlebo, please also read our <a href="/phlebo/code-of-conduct">Code of Conduct</a>.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "earnings-payments",
    title: "Earnings & Payments",
    metaTitle: "Earnings & Payments | Example Diagnostics Lab Phlebo App",
    metaDescription:
      "How Phlebo earnings are calculated, the payment cycle, incentives, deductions and how to raise a payment query.",
    content: `
<h1>Earnings &amp; Payments</h1>
<p>Transparent, timely payments are core to how we work with our Phlebo partners. This page explains exactly how your earnings are calculated, when you get paid, and how to resolve a payment query.</p>

<h2>How Earnings Are Calculated</h2>
<p>Your earnings are made up of a per-visit collection fee plus applicable incentives:</p>
<ul>
<li><strong>Per-Visit Fee</strong> — a fixed amount credited for every successfully completed home-collection visit</li>
<li><strong>Distance/Zone Incentive</strong> — additional amount for visits in extended service zones, where applicable</li>
<li><strong>Multi-Test Bonus</strong> — an added incentive when a single visit involves multiple tests or family members</li>
<li><strong>Performance Incentives</strong> — periodic bonuses tied to attendance consistency, punctuality, and patient feedback ratings</li>
</ul>

<h2>Earnings Slabs</h2>
<table>
<thead>
<tr><th>Visit Type</th><th>Base Payout</th><th>Notes</th></tr>
</thead>
<tbody>
<tr><td>Standard single-patient visit</td><td>As per your current rate card</td><td>Displayed in-app under Earnings &gt; Rate Card</td></tr>
<tr><td>Multi-patient / family visit</td><td>Base payout + multi-test bonus</td><td>Applies when collecting from more than one family member in one visit</td></tr>
<tr><td>Extended zone visit</td><td>Base payout + zone incentive</td><td>Applicable zones are shown at the time of job assignment</td></tr>
</tbody>
</table>
<p>Your exact, current rate card is always visible in the <strong>Earnings</strong> section of the Phlebo App and may be revised periodically with prior notice.</p>

<h2>Payment Cycle</h2>
<p>Earnings are calculated on a running basis as you complete visits, and disbursed on a fixed periodic cycle (weekly or as communicated during onboarding) directly to your registered bank account.</p>

<h2>Payment Mode</h2>
<p>All payments are made via direct bank transfer to the account details submitted and verified during your onboarding. Ensure your bank details in the app are always accurate and up to date to avoid payment delays.</p>

<h2>Incentives &amp; Bonuses</h2>
<p>In addition to standard per-visit earnings, we periodically run performance incentive programs — such as attendance streak bonuses or high-rating bonuses — communicated through in-app notifications when active.</p>

<h2>Deductions</h2>
<p>Applicable statutory deductions (such as TDS, where required by law) may be reflected in your payout summary. Any deduction will always be clearly itemised in your earnings statement — never applied silently.</p>

<h2>Viewing Your Earnings</h2>
<p>Open the <strong>Earnings</strong> tab in the Phlebo App to view your daily, weekly, and monthly earnings breakdown, complete payout history, and current rate card at any time.</p>

<h2>Raising a Payment Query</h2>
<p>If you believe a payment is missing or incorrect, raise a query directly from the Earnings section with the relevant visit or payout reference. Our team reviews and responds to payment queries within the timeframe stated in the app.</p>

<h2>Contact</h2>
<p>For any earnings or payment-related assistance, use the <strong>Help &amp; Support</strong> section in the Phlebo App or write to <strong>${CONTACT_EMAIL}</strong>.</p>`,
  },
  {
    appType: "PHLEBO",
    slug: "code-of-conduct",
    title: "Code of Conduct",
    metaTitle: "Code of Conduct | Example Diagnostics Lab Phlebo App",
    metaDescription:
      "The professional and ethical standards every Example Diagnostics Lab Phlebo partner is expected to uphold on every visit.",
    content: `
<h1>Code of Conduct</h1>
<p>Every Phlebo represents Example Diagnostics Lab at the most important point of the diagnostic journey — the patient's doorstep. This Code of Conduct sets out the professional and ethical standards every Phlebo partner is expected to uphold on every visit, without exception.</p>

<h2>1. Integrity &amp; Honesty</h2>
<ul>
<li>Always report visit outcomes, sample status, and attendance truthfully in the app</li>
<li>Never misrepresent your identity, qualifications, or the services being provided</li>
<li>Never falsify collection times, locations, or patient information</li>
</ul>

<h2>2. Patient Confidentiality</h2>
<ul>
<li>Treat every patient's identity, address, and health information as strictly confidential</li>
<li>Never discuss one patient's details with another patient or with unauthorised persons</li>
<li>Never retain, copy, or share patient information outside the Phlebo App</li>
</ul>

<h2>3. No Solicitation of Additional Payment</h2>
<ul>
<li>Never request, accept, or hint at additional payment, tips, or favours from patients beyond the confirmed order amount</li>
<li>Report any patient attempt to offer unauthorised payment to Phlebo Support</li>
<li>Any violation of this rule is treated as serious misconduct and may result in immediate termination</li>
</ul>

<h2>4. Punctuality &amp; Reliability</h2>
<ul>
<li>Honour every accepted assignment; avoid last-minute cancellations except in genuine emergencies</li>
<li>Arrive within the committed time window and communicate proactively in case of unavoidable delay</li>
<li>Maintain consistent, accurate availability status in the app</li>
</ul>

<h2>5. Appearance &amp; Professional Presentation</h2>
<ul>
<li>Wear the official uniform and visible ID badge on every visit</li>
<li>Maintain a clean, professional appearance in line with our Grooming Standards</li>
<li>Communicate politely and respectfully with every patient, regardless of circumstance</li>
</ul>

<h2>6. Safety &amp; Compliance</h2>
<ul>
<li>Follow all Sample Collection SOP, hygiene, and PPE requirements on every visit without exception</li>
<li>Dispose of biomedical waste strictly as per our Bio-Medical Waste guidelines</li>
<li>Never compromise on safety protocols, even under time pressure</li>
</ul>

<h2>7. Respect &amp; Non-Discrimination</h2>
<ul>
<li>Treat every patient with equal respect and courtesy, regardless of background, gender, age, or health condition</li>
<li>Zero tolerance for any form of harassment, discrimination, or inappropriate behaviour towards patients or colleagues</li>
</ul>

<h2>8. Reporting Violations</h2>
<p>If you witness or experience any violation of this Code of Conduct — by yourself, another Phlebo, or a patient — report it immediately through the <strong>Help &amp; Support</strong> section of the app. All reports are treated confidentially and investigated promptly.</p>

<h2>9. Disciplinary Action</h2>
<p>Violations of this Code of Conduct may result in a formal warning, temporary suspension, or termination of your engagement with Example Diagnostics Lab, depending on the severity of the violation, in accordance with your engagement agreement.</p>

<h2>10. A Shared Commitment</h2>
<p>This Code of Conduct exists to protect patients, protect you, and protect the trust that Example Diagnostics Lab has built with every family we serve. We ask every Phlebo to treat it not as a rulebook, but as a shared commitment to doing this important work the right way, every time.</p>`,
  },
];
