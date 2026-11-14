import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import { LoginPage } from "@/pages/auth/LoginPage";
import { OtpPage } from "@/pages/auth/OtpPage";
import { CompleteProfilePage } from "@/pages/auth/CompleteProfilePage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

import { HomePage } from "@/pages/home/HomePage";
import { CityPage } from "@/pages/city/CityPage";
import { LegacyCityRedirect } from "@/pages/city/LegacyCityRedirect";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { TestDetailPage } from "@/pages/catalog/TestDetailPage";
import { PackageDetailPage } from "@/pages/catalog/PackageDetailPage";
import { TestsSegmentRoute } from "@/pages/catalog/TestsSegmentRoute";
import { PackagesSegmentRoute } from "@/pages/catalog/PackagesSegmentRoute";

import { CartPage } from "@/pages/cart/CartPage";
import { AddressListPage } from "@/pages/address/AddressListPage";
import { FamilyMembersPage } from "@/pages/family/FamilyMembersPage";
import { SlotSelectPage } from "@/pages/slot/SlotSelectPage";
import { PaymentPage } from "@/pages/checkout/PaymentPage";
import { OrderConfirmationPage } from "@/pages/checkout/OrderConfirmationPage";

import { HomeVisitBookingPage } from "@/pages/home-visit/HomeVisitBookingPage";
import { OrdersListPage } from "@/pages/orders/OrdersListPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { PrescriptionUploadPage } from "@/pages/prescriptions/PrescriptionUploadPage";
import { WalletPage } from "@/pages/wallet/WalletPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { AboutPage } from "@/pages/company/AboutPage";
import { FranchisePage } from "@/pages/company/FranchisePage";
import { CareersPage } from "@/pages/company/CareersPage";
import { ContactPage } from "@/pages/company/ContactPage";
import { FeedbackPage } from "@/pages/company/FeedbackPage";
import { BlogIndexPage } from "@/pages/company/BlogIndexPage";
import { BlogDetailPage } from "@/pages/company/BlogDetailPage";
import { PrivacyPolicyPage } from "@/pages/company/PrivacyPolicyPage";
import { TermsPage } from "@/pages/company/TermsPage";
import { RefundPolicyPage } from "@/pages/company/RefundPolicyPage";
import { GetAppPage } from "@/pages/company/GetAppPage";
import { NearbyLabsPage } from "@/pages/labs/NearbyLabsPage";
import { LabDetailPage } from "@/pages/labs/LabDetailPage";
import { OfferPage } from "@/pages/offer/OfferPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Bare, layout-less hop that every app QR code points at — it sniffs
          the scanning device's User-Agent and forwards to the right store.
          Deliberately outside `AppShell`: no nav/footer should ever paint for
          a page that redirects on mount. */}
      <Route path="/get-app" element={<GetAppPage />} />

      {/* Ad landing pages (Superadmin → CMS → Landing Pages). Outside AppShell
          on purpose: their own header/footer, no site navigation. A literal
          `/offer` segment, so it never collides with `/:citySlug`. */}
      <Route path="/offer/:slug" element={<OfferPage />} />

      <Route element={<AppShell />}>
        {/* Guest-browsable: no login required. Backs onto the equally
            guest-browsable `/master/cities`, `/user/home`, `/user/tests`,
            `/user/packages` and `/tests|packages/:id/details` APIs. */}
        <Route path="/" element={<HomePage />} />
        {/* Explicit redirects for the pre-rename URLs — old bookmarks/shared
            links/search-engine index entries still land somewhere correct
            instead of silently matching `/:citySlug` below with "home" or
            "catalog" as a bogus, non-existent city slug. */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/catalog" element={<Navigate to="/tests" replace />} />

        {/* The old two-segment shape. City pages live at the bare slug now,
            so anything still pointing here — a bookmark, a shared link, a
            search result — is forwarded rather than 404'd. */}
        <Route path="/city/:citySlug" element={<LegacyCityRedirect />} />
        {/* The prefix on its own means nothing. */}
        <Route path="/city" element={<Navigate to="/" replace />} />

        {/* The city landing page. `/jaipur` IS the page for Jaipur — its own
            hero, its own "home collection in {city}" copy, its own FAQs and
            its own canonical — not the Home page with a city selected, which
            is what it used to be and why the two read identically.

            Home stays at `/` and is city-independent; picking a city brings
            you here. This is also the URL the backend sitemap has always
            advertised for a city (`sitemapGenerator.service.ts`), so the two
            finally agree.

            A single dynamic segment never steals a match from any of this
            tree's *static* siblings (`/tests`, `/cart`, `/about`, …) — React
            Router ranks a literal path segment above a dynamic one
            regardless of declaration order — so only an unclaimed segment
            like `/jaipur` reaches it. One that isn't a real city is sent
            Home by `CityPage`'s own guard. */}
        <Route path="/:citySlug" element={<CityPage />} />

        {/* Tests/Packages catalog — two literal, tab-shaped URLs instead of
            one `/catalog` route with in-memory-only tab state, so the active
            tab survives a refresh/share/back-button. `CatalogPage` derives
            which tab is showing straight off `location.pathname`. */}
        <Route path="/tests" element={<CatalogPage />} />
        <Route path="/packages" element={<CatalogPage />} />
        {/* One route, two meanings: a bare Test/Package id (the pre-city-pick
            detail fallback) or a city slug (the list page's SEO landing url,
            `/tests/{citySlug}` — the counterpart to
            `/tests/{citySlug}/{testSlug}` below). `TestsSegmentRoute`/
            `PackagesSegmentRoute` tell them apart by shape — see their
            doc-comments — since both are single dynamic segments and can't
            be split into two distinct <Route>s. */}
        <Route path="/tests/:id" element={<TestsSegmentRoute />} />
        <Route path="/packages/:id" element={<PackagesSegmentRoute />} />

        {/* SEO-friendly twins of the two routes above — city-priced and
            fetched by slug instead of id (see `catalogApi.ts`'s *BySlug
            calls and `TestDetailPage`/`PackageDetailPage`'s own param
            branching, which doesn't care which of these two matched). A
            2-segment path never collides with the 1-segment route above:
            different segment counts, so both coexist without any ranking
            ambiguity. Every in-app card link that knows the selected city
            (`TestCard`/`PackageCard`) already points here; the plain-id
            route above is only the fallback for a guest with no city picked
            yet. */}
        <Route path="/tests/:citySlug/:testSlug" element={<TestDetailPage />} />
        <Route path="/packages/:citySlug/:packageSlug" element={<PackageDetailPage />} />

        {/* A directly-bookable Parameter's own detail page. Same component
            and same backing API as the Test route above — a bookable
            analyte IS a Test behind the scenes (its auto-provisioned
            "shadow" Test, see `Test.sourceParameterId`) — but it gets its
            own URL family so an analyte page and a real test page are
            distinguishable to a patient and to a crawler. `TestDetailPage`
            canonicalises both directions: a shadow Test opened under
            `/tests/...` redirects here, and a real Test opened here
            redirects there, so neither ever has two indexable URLs. */}
        <Route path="/parameter/:citySlug/:testSlug" element={<TestDetailPage />} />

        {/* Company/info pages — plain static content, no session or
            protected API calls, so guests can browse these too. */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/franchise" element={<FranchisePage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />

        {/* Nearest labs — guest-browsable on purpose: "is there a lab near
            me?" is a question someone asks BEFORE signing up, and it's the
            Home screen's own "Nearest Lab" quick action, which a guest can
            tap. Backed by the equally public `/user/centers` and
            `/user/center-details/:id` (franchise directory data, nothing
            patient-specific — see `nearbyLabs.routes.ts`). */}
        <Route path="/nearby-labs" element={<NearbyLabsPage />} />
        <Route path="/nearby-labs/:id" element={<LabDetailPage />} />

        {/* Legal — reproduced in-app (not linked out) so guests can read
            them without ever leaving the site, let alone logging in. */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />

        {/* Everything past "browse" — cart, checkout, account — still needs a
            real session. `useAddToCart` sends a guest to `/login` before it
            ever reaches here, but a direct URL hit is guarded here too. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/addresses" element={<AddressListPage />} />
          <Route path="/family-members" element={<FamilyMembersPage />} />
          <Route path="/slots" element={<SlotSelectPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
          <Route path="/book-home-visit" element={<HomeVisitBookingPage />} />

          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/prescriptions" element={<PrescriptionUploadPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRoutes };
