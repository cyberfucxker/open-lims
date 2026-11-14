import { Router } from "express";
import { appMasterRouter } from "./master.routes";
import { appAuthRouter } from "./auth.routes";
import { appProfileRouter } from "./profile.routes";
import { appFamilyMemberRouter } from "./familyMember.routes";
import { appAddressRouter } from "./address.routes";
import { appHomeRouter } from "./home.routes";
import { appCatalogRouter } from "./catalog.routes";
import { appCatalogDetailRouter } from "./catalogDetail.routes";
import { appCartRouter } from "./cart.routes";
import { appNearbyLabsRouter } from "./nearbyLabs.routes";
import { appSlotRouter } from "./slot.routes";
import { appOrderRouter } from "./order.routes";
import { appPaymentRouter } from "./payment.routes";
import { appWalletRouter } from "./wallet.routes";
import { appPrescriptionRouter } from "./prescription.routes";
import { appMyReportsRouter } from "./myReports.routes";
import { appSupportTicketRouter } from "./supportTicket.routes";
import { appConfigRouter } from "./appConfig.routes";
import { appThirdPartyReportRouter } from "./thirdPartyReport.routes";
import { appNotificationRouter } from "./notification.routes";
import { appSitemapRouter } from "./sitemap.routes";
import { appGeocodeRouter } from "./geocode.routes";
import { appBlogRouter } from "./blog.routes";
import { appLandingRouter } from "./landing.routes";

const router = Router();

// Patient App module — each sub-router is added here as it's
// built; mounted at /api/v1/app in app.ts (see AppApiResponse/appAuth docs
// on why this namespace is kept separate from the internal /api/v1 router).

router.use(appMasterRouter);
router.use(appAuthRouter);
router.use(appProfileRouter);
router.use(appFamilyMemberRouter);
router.use(appAddressRouter);
router.use(appHomeRouter);
router.use(appCatalogRouter);
router.use(appCatalogDetailRouter);
router.use(appCartRouter);
router.use(appNearbyLabsRouter);
router.use(appSlotRouter);
router.use(appOrderRouter);
router.use(appPaymentRouter);
router.use(appWalletRouter);
router.use(appPrescriptionRouter);
router.use(appMyReportsRouter);
router.use(appSupportTicketRouter);
router.use(appConfigRouter);
router.use(appThirdPartyReportRouter);
router.use(appNotificationRouter);
router.use(appSitemapRouter);
router.use(appGeocodeRouter);
router.use(appBlogRouter);
router.use(appLandingRouter);

export { router as appApiRouter };
