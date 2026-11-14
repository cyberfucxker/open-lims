import type { AuthenticatedUser } from "./auth.types";
import type { AuthenticatedAppUser } from "./appAuth.types";
import type { AuthenticatedPhlebo } from "./phleboAuth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      /** Set by `authenticateAppUser` for Patient App (`/api/v1/app/*`)
       *  requests — entirely separate from staff `req.user` above. */
      appUser?: AuthenticatedAppUser;
      /** Set by `authenticatePhlebo` for Phlebo App (`/api/v1/sample-boy/*`)
       *  requests — entirely separate from `req.user`/`req.appUser` above. */
      phlebo?: AuthenticatedPhlebo;
    }
  }
}

export {};
