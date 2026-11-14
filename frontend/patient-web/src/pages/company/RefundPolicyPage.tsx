import { LegalPageLayout, p, type LegalSection } from "@/components/common/LegalPageLayout";
import { useSeoMeta } from "@/hooks/useSeoMeta";

/** Verbatim copy of https://www.example.com/refund_policy — reproduced
 *  in-app (rather than linked out) so guests never leave the site to read
 *  it. Keep this in sync with the source page. */
const SECTIONS: LegalSection[] = [
  {
    id: "refund-policy",
    heading: "Refund Policy",
    blocks: [
      p("1. To claim a refund, kindly support it with related documents/reports."),
      p("2. In normal cases, any report comparisons beyond 7 days will not be considered."),
      p(
        "3. In the case of chronic diseases, an exception can be made up to 15 days, only after approval from our Quality team.",
      ),
      p(
        "4. In the case of Thyroid, TSH values can vary due to various factors like time of sample collection and fasting status. Only significant variations in TSH levels will be considered.",
      ),
      p("5. Any variation in Lipid profile will not be considered."),
      p(
        "6. In the case of any discrepancy in test results, a free re-sample will be collected and sent to 2 partner labs — 1 sample to our partner lab and another to a standard lab. If a variation is found in the results, we will refund the entire test amount.",
      ),
      p("7. Our quality team reserves the right to make the final decision."),
    ],
  },
];

function RefundPolicyPage() {
  useSeoMeta({
    title: "Refund Policy | Example Diagnostics Lab",
    description: "Example Diagnostics Lab's policy on refunds, report comparisons and claims.",
    canonicalPath: "/refund-policy",
  });

  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Refund Policy"
      subtitle="How Example Diagnostics Lab handles refund requests for test results and reports."
      sections={SECTIONS}
      showTableOfContents={false}
    />
  );
}

export { RefundPolicyPage };
