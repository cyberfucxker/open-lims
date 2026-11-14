import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CmsPagesList } from "./CmsPagesList";

/** CMS Pages tab — the Patient App ("User App") and Phlebo App maintain
 *  entirely independent sets of pages (separate slugs, separate public URL
 *  prefixes — see cmsPage.repository.ts#buildPublicUrl), so each gets its
 *  own sub-tab and its own `CmsPagesList` instance. */
function CmsPagesTab() {
  return (
    <Tabs defaultValue="user">
      <TabsList>
        <TabsTrigger value="user">User App</TabsTrigger>
        <TabsTrigger value="phlebo">Phlebo App</TabsTrigger>
      </TabsList>
      <TabsContent value="user" className="mt-4">
        <CmsPagesList appType="USER" />
      </TabsContent>
      <TabsContent value="phlebo" className="mt-4">
        <CmsPagesList appType="PHLEBO" />
      </TabsContent>
    </Tabs>
  );
}

export { CmsPagesTab };
