import { LegalPageLayout, list, p, type LegalSection } from "@/components/common/LegalPageLayout";
import { useSeoMeta } from "@/hooks/useSeoMeta";

/** Verbatim copy of https://www.example.com/Terms_of_Service — reproduced
 *  in-app (rather than linked out) so guests never leave the site to read
 *  it. Keep this in sync with the source page; it's the company's legal
 *  terms text, not marketing copy we get to rewrite. */
const SECTIONS: LegalSection[] = [
  {
    id: "intro",
    heading: "Introduction",
    blocks: [
      p("This Terms of Service applies to the Customers only."),
      p(
        "Welcome to Example Diagnostics Lab website. The content of this website pertains to Example Diagnostics Lab and is the property of Example Diagnostics Lab Pvt. Ltd. having its registered office at 123 Example Street, Sample City, State 000000. Example Diagnostics Lab is India's largest test @home service and assures quality collection and testing across its network of labs and hundreds of full-time phlebotomists.",
      ),
    ],
  },
  {
    id: "general-terms",
    heading: "General Terms",
    blocks: [
      list([
        "For the purpose of these Terms of Use, along with any amendments to the same, and wherever the context so requires “You”, “Your” or “User” shall mean any natural or legal person who has agreed to become a user of the Website. The term “We”, “Us”, “Our”, “Company”, “Example Diagnostics Lab” shall mean the Example Diagnostics Lab Pvt. Ltd. (which includes successors, representative-in-interest and permitted assigns). “Third Party” shall mean and refer to any individual(s), company or entity apart from the User and Example Diagnostics Lab.",
        "These Terms of Use, Privacy policy, together with any additional Service specific terms and conditions, other policies which may be applicable and/or available on our Website, “www.example.com” and any disclaimers which may be present on the Website/Application are jointly referred to as “Terms of Use or Agreement” and constitute the terms of your access and use of the Website/Application and the Services. Where any part of the Agreement is amended in accordance with the terms of the Agreement, the Agreement shall be enforceable in its amended form. Please be sure to review this Agreement periodically to ensure familiarity with the most current version. If at any time the terms and conditions of this Agreement are no longer acceptable to you, you should immediately cease all use of the Service.",
        "By accessing, registering or using the Services you agree to be legally bound by these Terms of Use/Agreement and consent to our usage of information as outlined in our Privacy Policy. Your use of our Services is subject to your compliance with these Terms of Use. These Terms of Use apply to all visits to our web portal Example Diagnostics Lab or any other portal and all other applications (“Website”) and all uses of our services, including (but not limited to) all associated content, information, recommendations, and/or services provided to you by or through our services, as detailed on the Website (“Services”). By accessing and using our Services, you hereby agree to these Terms of Use/Agreement, in its entirety. You may not use our Services (or any part thereof) if you do not agree to be bound by this agreement. If you continue to browse and use this Website, you are agreeing to comply with and be bound by the following terms and conditions of use/Agreement. If you disagree with any part of these terms and conditions/agreement, please do not use our Website.",
      ]),
      p("The use of this Website is subject to the following terms and conditions:"),
      p(
        "In case of non-compliance with any applicable laws, rules or regulations, or the Agreement by a User, Example Diagnostics Lab has the right to immediately terminate the access or usage rights of the User to the Services and to remove non-compliant information.",
      ),
      p(
        "Example Diagnostics Lab may disclose or transfer sensitive personal data / information to the extent it is necessary to provide the Services, to another entity or person, as per the Privacy Policy.",
      ),
      p(
        "Example Diagnostics Lab retains the right at any time to deny or suspend access to any or all sections of/services provided through the Website to any user, who We believe, has violated any of the provisions of these Terms and Conditions of Use/Agreement.",
      ),
    ],
  },
  {
    id: "services-and-use",
    heading: "1. Services and Use of Website",
    blocks: [
      p(
        "While some of the content and pages of the Website are free to view, but to gain access to majority of the contents or services provided by the Website, you will need to create an account on the Website. To create an account on the Website, you will be asked to complete the registration form and fill in certain details such as name, age, date of birth, address, mobile number, e-mail id, etc. You expressly acknowledge that Example Diagnostics Lab will rely on the information as would be provided by you and thus you hereby warrant that any and all information provided by you in the course of creating the account is true and accurate.",
      ),
      p(
        "Example Diagnostics Lab provides Services through the Website to facilitate customers/users to avail diagnostic test/packages facilities through the website. However, Example Diagnostics Lab shall not be liable and does not validate, endorse or approve any information or content posted on its Website. Furthermore, while availing the Services, the users/customers understand and accept that:",
      ),
      list(
        [
          "Example Diagnostics Lab does not recommend or endorse any diagnostic test/packages mentioned on the Website;",
          "Example Diagnostics Lab does not make any representations and warranties with respect to the diagnostic labs/consultants or the quality of the services that is provided by such diagnostic labs/consultants;",
          "Users/customers will be responsible for choosing the services listed on the Website.",
        ],
        true,
      ),
      p(
        "Example Diagnostics Lab is not and shall not be responsible for any sample collected, tests conducted and reports generated by the labs and does not deal with any of User's client or patient managed by User through the Website and only provides Services to User through the Website. User agrees to use the Website and the materials provided therein only for purposes that are permitted by: (a) the Terms of Use; and (b) any applicable law, regulation or generally accepted practices or guidelines in the relevant jurisdictions.",
      ),
      list([
        "User may not access the Services for purposes of monitoring their availability, performance or functionality, or for any other benchmarking or competitive purposes.",
        "The user is hereby granted a limited, non-exclusive, non-transferable right to access our website and use the Services solely for user's personal non-commercial use and in accordance with the permitted Terms of Use mentioned herein. Without limitation to the foregoing, in the event the user is barred from undertaking legally binding obligations under the Indian Contract Act, 1872, or are for any reason, unable to provide 'Consent' as per the Information Technology (Reasonable security practices and procedures and sensitive personal data or information) Rules, 2011, the user is not eligible to register for, use or avail the services available on the Website.",
        "Example Diagnostics Lab will provide to the User basic support for the Services at no additional charge, and/or upgraded support, if purchased separately, and will use commercially reasonable efforts to make the Services available, except for (i) planned downtime or (ii) any unavailability caused by circumstances beyond Example Diagnostics Lab' reasonable control, including without limitation, acts of God, acts of government, flood, fire, earthquakes, civil unrest, acts of terror, strikes or other labour problems, or internet service provider failures or delays.",
      ]),
      p(
        "Not withstanding anything to the contrary contained herein, User alone shall be liable for User's dealings and interaction with clients or diagnostic centres and laboratories contacted or managed through the Website and Example Diagnostics Lab shall have no liability or responsibility in this regard. The Services should not be used for emergency appointment purposes.",
      ),
      p(
        "Example Diagnostics Lab may, at its sole discretion, suspend User's ability to use or access the Website at any time while it investigates complaints or alleged violations of these Terms of Use, or for any other reason. If Users find any wrong information on the Website in relation to such User, they can correct it themselves or contact Example Diagnostics Lab at info@example.com immediately for such corrections.",
      ),
      p(
        "User shall be bound by terms and conditions of this Agreement. Any violation of the same gives the right to the company to take appropriate action against the user.",
      ),
      p(
        "Shipping and delivery of reports: Example Diagnostics Lab provides you with the best-in-class experience at every step of the way. We assure you that all due precautions are taken so that your report reaches you intact.",
      ),
      p("Estimated Sample collection time and Report Generation Time:"),
      list(
        [
          "Your sample collection will typically be done on the chosen date and time. If not, you can always reschedule to another available date and available time slot.",
          "Sometimes, sample collection may take longer due to bad weather, political disruptions, government orders and other unforeseen circumstances. In such cases, we will proactively reach out to you. Please check your emails and SMS regularly for such updates.",
          "Report will be generated within 24 hours and a soft copy will be sent to you for the same from our end. But, sometimes, some tests/culture tests take time, so your report will be sent when your test results are out and after we receive it. You hereby agree to the delay that may be caused in providing the reports.",
          "With regard to the B2B services provided by the Company to the Users of the other business entity, the User hereby provides his/her consent to the Company to share the Diagnostic Medical Report of the User, including but not limited to the report regarding HIV test, with the said business entity. The role of Example Diagnostics Lab is only limited to conducting the tests; all other responsibilities shall lie with the Business entity only.",
          "You hereby give your consent to share your Diagnostic medical report with the concerned employer/business entity which is dealing with us on your behalf unless specified otherwise.",
        ],
        true,
      ),
      list([
        "Example Diagnostics Lab reserves the right to activate or deactivate any offers and promotions on the service provided at any time.",
        "You agree that we may send you text notifications and marketing offers. You acknowledge that consent is not a condition for any purchase.",
        "By entering your phone number at signup, you agree that we may send you text notifications, text marketing offers and health checkup reminders. By signing up you provide your consent to receive communication from Example Diagnostics Lab.",
      ]),
    ],
  },
  {
    id: "non-transferable",
    heading: "2. Non-transferable Right to Use the Services",
    blocks: [
      p(
        "Your right to use the Services is not transferable. Any password or right given to you to obtain information or documents from the Website is not transferable. Example Diagnostics Lab may freely transfer, assign or delegate all or any part of this Terms of Use, and any rights and duties hereunder. This Terms of Use will be binding upon and inure to the benefit of the heirs, successors and permitted assignees of the parties.",
      ),
    ],
  },
  {
    id: "payment-fees-taxes",
    heading: "3. Payment, Fees and Taxes",
    blocks: [
      list([
        "The User agrees to pay all Package fees, consulting fees and other fees applicable to User's use of Services and the User shall not circumvent the fee structure. The fee is dependent on the Package that User purchases and not on actual usage of the Services.",
        "Each User/member is solely responsible for payment of all taxes, legal compliances, statutory registrations and reporting. Example Diagnostics Lab is in no way responsible for any of the taxes except for its own income tax.",
        "The fees could be paid online through the facility made on the Website. Third parties support and services are required to process online fee payment; Example Diagnostics Lab is not responsible for any loss or damage caused to User during this process as these third parties are beyond the control of Example Diagnostics Lab. The fees could also be paid offline and be either collected personally from the User.",
        "All fees are exclusive of applicable taxes.",
        "Example Diagnostics Lab reserves the right to modify the fee structure by updating the fee structure on the Website which shall be considered as valid and agreed communication.",
        "In order to process the payments, Example Diagnostics Lab might require details of User's bank account, credit card number, etc.",
      ]),
    ],
  },
  {
    id: "cancellation-refund",
    heading: "4. Cancellation and Refund Policy",
    blocks: [
      list([
        "Example Diagnostics Lab reserves the right to reschedule or cancel an appointment without any prior notice. The time provided for consultation or conducting test is indicative and actual time for availing the Services may change depending on the availability of the phlebotomists. The user/customer can reschedule or cancel the service.",
        "In case of cancellation or non-confirmation of the appointment by Example Diagnostics Lab due to any reason, the user/customer may ask for rescheduling the appointment within 15 (fifteen) days and if user/customer fails to reschedule the appointment within 15 (fifteen) days then such user/customer will not be entitled for any refund or cancellation of the payment as may be made to Example Diagnostics Lab.",
        "No refund will be given after 15 (fifteen) days from the day the payment is made to the company. However, in case a written request for refund reaches the company within 15 (fifteen) days, the entire amount paid (without interest — subject to a deduction of INR 150/- towards administrative charges) will be credited for any further purchase of similar or exceeding amount within a maximum of 30 (thirty) days from date of cancellation.",
        "The stated amount due for refund shall be processed within 15 (fifteen) business working days from the date of the cancellation, subject to all terms and conditions being met successfully. In case of cash payment, the money will be transferred through Bank a/c NEFT or Cheque.",
        "Example Diagnostics Lab shall not be responsible in any manner for any inconvenience or loss caused to the user as a result of such rescheduling or cancellation. Further Example Diagnostics Lab reserve the right to refuse Service at any time without providing any reasons.",
      ]),
    ],
  },
  {
    id: "personal-information",
    heading: "5. Collection, Use, Storage and Transfer of Personal Information",
    blocks: [
      p(
        "Our Website may include pages that give you the opportunity to provide us with Personal Information about yourself which shall be dealt as per the Privacy Policy of the Company. Further you agree to the following:",
      ),
      list(
        [
          "Collection and Delivery are dependent on various technical and quality parameters. Example Diagnostics Lab assumes no liability towards any time delay caused on account of the above factors necessary for review, analysis reporting and third-party service delay outside of our control. Example Diagnostics Lab does not provide medical advice and services offered must not be considered as a substitute for professional medical advice, diagnosis or treatment. Please correlate clinically.",
          "Example Diagnostics Lab shall not be responsible in any manner for the authenticity of the personal information or sensitive personal data or information supplied by the User to Example Diagnostics Lab or any other person acting on behalf of Example Diagnostics Lab.",
          "The User is responsible for maintaining the confidentiality of the User's account access information and password and restricting any unauthorised access and use of Services through the Website. The User shall immediately notify Example Diagnostics Lab of any actual or suspected unauthorized use of the User's account or password.",
          "If a User provides any information that is false, inaccurate, not current or incomplete, or Example Diagnostics Lab has reasonable grounds to suspect that such information is false, inaccurate, not current or incomplete, Example Diagnostics Lab has the right to suspend or terminate such account at its sole discretion.",
          "User do hereby authorise Example Diagnostics Lab and its officials to collect the electronic copy of the report from the Diagnostic centre/Labs and provide the same to the Users.",
          "By subscribing to Healthy Updates on the website/app by inputting your email id, you give Example Diagnostics Lab permission/consent to communicate via email for relevant and related commercial emails. If you do not wish to receive such emails, please advise us and we will immediately unsubscribe that person from such emails.",
        ],
        true,
      ),
    ],
  },
  {
    id: "prohibited-actions",
    heading: "6. Prohibited Actions",
    blocks: [
      p("The User is prohibited from:"),
      list([
        "Violating or attempting to violate the integrity or security of the Website or any Example Diagnostics Lab Content;",
        "Transmitting any information (including job posts, messages and hyperlinks) on or through the Website that is disruptive or competitive to the provision of Services by Example Diagnostics Lab;",
        "Intentionally submitting on the Website any incomplete, false or inaccurate information;",
        "Making any unsolicited communications to other Users;",
        "Using any engine, software, tool, agent or other device or mechanism (such as spiders, robots, avatars or intelligent agents) to navigate or search the Website;",
        "Attempting to decipher, decompile, disassemble or reverse engineer any part of the Website;",
        "Copying or duplicating in any manner any of the Example Diagnostics Lab Content or other information available on the Website;",
        "Conducting any systematic or automated data collection activities including without limitation scraping, data mining, data extraction and data harvesting on or in relation to our website Services without express written consent;",
        "Violating any local, state, national or international law;",
        "Using the website in a way which interferes, disrupts or hampers with the proper functioning of the website;",
        "Attempting to gain unauthorized access (other than through the interface that is provided by the Website) to our website and/or Services;",
        "Interfering with or disrupting the integrity, security or performance of our Services;",
        "Creating accounts for our Services through unauthorized or automated means;",
        "Framing or hotlinking or deeplinking any Example Diagnostics Lab Content;",
        "Posting materials to any of the Website's social media pages or otherwise on social media, that are unlawful, fraudulent, libelous, slanderous, defamatory, abusive, harassing, threatening, obscene or infringing on the rights of any third-party, including without limitation intellectual property, privacy/confidentiality or publicity rights.",
      ]),
      p(
        "Example Diagnostics Lab does not permit any of these practices and reserves the right to immediately remove content within its sole discretion. Example Diagnostics Lab further reserves the right to block or otherwise prohibit the user/customer from accessing or using the Website, its social media pages or application.",
      ),
    ],
  },
  {
    id: "liability",
    heading: "7. Liability",
    blocks: [
      list([
        "Example Diagnostics Lab shall not be responsible or liable in any manner to the Users for any losses, damage, injuries or expenses incurred by the Users as a result of any disclosures made by Example Diagnostics Lab, where the User has consented to the making of disclosures by Example Diagnostics Lab.",
        'The Services provided by Example Diagnostics Lab or any of its licensors or providers are provided "as is," as available, and without any warranties or conditions, express or implied. The information via the Services is for general information purposes only and does not constitute advice, medical or otherwise.',
        "The Website may be linked to the website of third parties, affiliates and business partners. Example Diagnostics Lab has no control over, and is not liable or responsible for content, accuracy, validity, reliability or quality of such websites. User may use the links and these services at User's own risk.",
        "We are not responsible for any charges or fees associated with financial transactions that occur on or through third party websites.",
        "Example Diagnostics Lab shall not be responsible for the mishaps/missed services due to no service/no show from the lab for sample collection, nor for any error in the sample collection and/or reports generated by the Labs/Diagnostic Centres.",
        "Example Diagnostics Lab assumes no responsibility for any damages to, or viruses that may infect, User's equipment on account of accessing, using or browsing the Website, or downloading any material from it. If a User is dissatisfied with the Website, User's sole remedy is to discontinue using the Website.",
        "In no event shall Example Diagnostics Lab, or any of its directors, officers, employees, agents or content or service providers be liable for any direct, indirect, special, incidental, consequential, exemplary or punitive damages arising from or related to the use of, or the inability to use, the Website. In no event shall the total aggregate liability of the protected entities to a User for all damages, losses, and causes of action arising from these terms or a User's use of the Website exceed, in the aggregate, INR 1,000/-.",
        "In no event shall the protected entities be liable for failure on the part of the diagnostic centres to provide agreed services, or for any comments or feedback given by any Users in relation to services provided by any diagnostic centres.",
        "The listing of diagnostic centres on the Website is based on numerous factors including User's comments and feedback. In no event shall the protected entities be liable or responsible for the listing order of diagnostic centres on the Website.",
        "The use of the website may take the user to links to websites or Applications on the Internet which are owned and operated by third parties; we are not liable or responsible for the content on any third party application.",
        "User further agrees that by using the website or related Services, user may be exposed to content from other Users or Third Parties that user may consider offensive, indecent or otherwise objectionable. We shall not be liable for such content. Users may report such offensive content.",
      ]),
    ],
  },
  {
    id: "indemnity",
    heading: "8. Indemnity",
    blocks: [
      p(
        "User agrees to indemnify and hold harmless Example Diagnostics Lab, its affiliates, officers, directors, employees, consultants, licensors, agents, and representatives from any and all third party claims, losses, liability, damages, and/or costs (including reasonable attorney fees and costs) arising from his/her/its access to or use of the Website, violation of this Terms of Use, or infringement by user of any intellectual property or other right of Example Diagnostics Lab or any person or entity.",
      ),
      p(
        "Under no circumstances shall Example Diagnostics Lab be liable for any defamatory, offensive or illegal conduct of any user/customer. If any user/customer is dissatisfied with any of the services provided by the diagnostic labs, the user/customer may approach such diagnostic lab and/or discontinue using the Website and the services provided/listed on the Website.",
      ),
    ],
  },
  {
    id: "term-termination",
    heading: "9. Term, Termination and Disputes",
    blocks: [
      p(
        "These Terms and Conditions of Use/Agreement will remain in full force and effect while the User is a user of the Website in any form or capacity.",
      ),
      p(
        "Example Diagnostics Lab reserves the right to terminate the access to the Website and account of the user, including but not limited to where:",
      ),
      list(
        [
          "A User breaches any terms and conditions of this Agreement;",
          "Example Diagnostics Lab is unable to verify or authenticate any information provided to it by a User; or",
          "Example Diagnostics Lab believes in its sole discretion that User's actions may cause legal liability for such User, other Users or Example Diagnostics Lab, or are contrary to the interests of the Website.",
        ],
        true,
      ),
      p(
        "Example Diagnostics Lab further reserves the right to suspend, restrict or terminate the profile/account of the user without stating any reasons whatsoever; the user may likewise remove their account at any time. On termination, the User shall no longer have access to data, messages, files and other material kept on the Website, and should therefore keep a continuous backup of their own records.",
      ),
      p(
        "These binding Terms of Use and any contractual obligation between Example Diagnostics Lab and User will be governed by the laws of India. All disputes related to this Agreement will be subject to arbitration in New Delhi, in English, by an independent sole arbitrator (a retired judge/judicial officer) appointed by Example Diagnostics Lab, in accordance with the Arbitration and Conciliation Act, 1996 (as amended). Subject to arbitration, the jurisdictional courts at New Delhi shall be entitled to grant interim relief/injunction.",
      ),
      p(
        "Even after termination, obligations mentioned under Covenants, Liability, Indemnity, Intellectual Property and Dispute Resolution will continue and survive termination.",
      ),
    ],
  },
  {
    id: "severability",
    heading: "10. Severability, Waiver & Medical Disclaimer",
    blocks: [
      p(
        "If any provision of this Terms of Use is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced. The failure of either Party to act in the event of a breach shall not be deemed a waiver of such breach or of future breaches, unless in writing and signed by the Party against whom enforcement is sought.",
      ),
      p(
        "We do not provide medical advice. The information that you obtain or receive from Example Diagnostics Lab on the Website is for informational and scheduling purposes only and is not intended as a substitute for, and does not replace, professional medical advice, diagnosis, or treatment. Do not disregard, avoid or delay obtaining medical advice from a qualified health care professional because of something you may have read on the site. Do not use the site for emergency medical needs — your use of information on the Website is solely at your own risk.",
      ),
      p(
        "No licensed medical professional/patient relationship is created by using information provided by or through the use of the Website, including the Find a Test feature or any assistance we may provide to help you find an appropriate medical professional/diagnostic centre. We make no guarantees, representations or warranties, express or implied, with respect to professional qualifications, expertise or quality of work. We have no control over, and cannot guarantee the availability of, any diagnostic centre at any particular time, and will not be liable for cancelled or otherwise unfulfilled appointments or any injury resulting therefrom. You are strongly advised to perform your own investigation prior to selecting a health care diagnostic centre.",
      ),
      p(
        "We do not represent or warrant that the content or information provided via our Services is accurate, complete or current, or that our Services will be uninterrupted or error free. We reserve the right to suspend or withdraw the whole or any part of our Services at any time without notice and without incurring any liability.",
      ),
    ],
  },
  {
    id: "modify-terms",
    heading: "11. Right to Modify Terms of Service",
    blocks: [
      p(
        "Example Diagnostics Lab reserves the right to revise and update these Terms of Use and the Privacy Policy at any time without notifying you. Please periodically review these Terms of Use, our Privacy Policy, and any other policies posted on this Website. Continued usage of our Services will be considered acceptance of any changes.",
      ),
      p(
        "Example Diagnostics Lab has the right to discontinue service, or deny access to anyone who violates our policies or these terms and conditions, without prior notice or warning.",
      ),
    ],
  },
  {
    id: "governing-law",
    heading: "12. Governing Law",
    blocks: [
      p(
        "This Privacy Policy and Terms of Use shall be governed by and constructed in accordance with the laws of India only, without reference to conflict of laws principles.",
      ),
      p(
        "A printed version of these Terms and Conditions of Use/Agreement and of any notice given in electronic form shall be admissible in judicial or administrative proceedings to the same extent and subject to the same conditions as other business documents and records originally generated and maintained in printed form.",
      ),
    ],
  },
  {
    id: "entire-agreement",
    heading: "13. Entire Agreement",
    blocks: [
      p(
        "These Terms of Use, together with the Privacy Policy, and any other terms of use/policy posted at Example Diagnostics Lab' web portal and other applications, represent the complete agreement between you and Example Diagnostics Lab concerning the subject matter hereof, and replace all prior oral or written communications concerning such subject matter.",
      ),
      p(
        "Your booking of the service and details provided therein shall stand deemed confirmed unless a change is updated to Example Diagnostics Lab. Acceptance of our service is deemed acceptance of our terms of use and privacy policy.",
      ),
      p(
        "Any rights not expressly granted herein by Example Diagnostics Lab are reserved by Example Diagnostics Lab.",
      ),
    ],
  },
  {
    id: "booking-terms",
    heading: "Booking Terms and Conditions",
    blocks: [
      p(
        "The following booking terms and conditions are applicable when you confirm your booking with Example Diagnostics Lab:",
      ),
      list([
        "I, my family member, anyone at home are not suffering from flu-like symptoms like fever, cough, breathlessness, sore throat, etc.",
        "I, my family member, anyone at home currently are not at risk in any manner from Covid-19.",
        "I have not travelled internationally in the last 14 days.",
        "I have not come in contact with any COVID-19 positive patient in the last 14 days.",
        "I understand that while Example Diagnostics Lab is taking all necessary safety and hygiene precautions, it cannot be held liable in the unfortunate event that I, my family member or the sample collection professional is diagnosed with COVID-19.",
        "Your test will be performed at a Example Diagnostics Lab associated partner lab nearest to you.",
        "All bookings for a Covid test will be collected and tested by an ICMR-approved lab partner nearest to your location.",
      ]),
    ],
  },
  {
    id: "cgm-booking-terms",
    heading: "CGM Booking Terms and Conditions",
    blocks: [
      p(
        "The following CGM booking terms and conditions are applicable when you confirm your CGM booking with Example Diagnostics Lab:",
      ),
      list([
        "Booking for the Example Diabetes Monitoring Program can be made by calling +91-9876543210.",
        "The individual who wears the Continuous Glucose Monitoring (CGM) Device will be considered the CUSTOMER.",
        "Example Diagnostics Lab has the right to ask for a valid Government ID at the time of booking.",
        "Data reading slots and dates once booked cannot be changed by the customer.",
        "Re-scheduling a data reading date is NOT allowed in case a customer is not available on the pre-chosen data reading day and time. A missed data reading slot cannot be booked again.",
        "Cancellation of booking or re-scheduling is allowed only for installation of the CGM Device.",
        "If the CGM device malfunctions for any reason, the customer will be given only ONE free device replacement; subsequent replacements would be chargeable.",
        "100% payment should be made to Example Diagnostics Lab one day prior to the CGM Device installation.",
        "All information provided by customers regarding their medical history shall be considered complete, truthful and accurate.",
        "The latest readings will be available within 12 hours of the readings recorded.",
        "The Example Diabetes Monitoring Program is limited to monitoring glucose levels and suggesting lifestyle changes; Example Diagnostics Lab cannot be held liable for any health complication arising due to the installation of the CGM Device.",
        "Example Diagnostics Lab strongly recommends that you always consult your doctor before taking any drug or changing your diet based on your glucose monitoring readings.",
        "The program depends on various third-party vendors for its technical architecture and systems; Example Diagnostics Lab assumes no responsibility for delays arising from unforeseen technical issues with such vendors.",
        "We respect the privacy of our users and have outlined strict guidelines for the collection, storage, use and disclosure of your personal data.",
      ]),
    ],
  },
];

function TermsPage() {
  useSeoMeta({
    title: "Terms & Conditions | Example Diagnostics Lab",
    description:
      "The terms that govern your use of Example Diagnostics Lab's website, app and services.",
    canonicalPath: "/terms",
  });

  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="The terms that govern your use of Example Diagnostics Lab's website, app and services."
      sections={SECTIONS}
    />
  );
}

export { TermsPage };
