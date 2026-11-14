import * as patientService from "./patient.service";
import * as testService from "./test.service";
import type { GlobalSearchResult } from "../types/globalSearch.types";

const RESULT_LIMIT = 5;

/** Fans a single query out to the Patient and Test catalogues in parallel,
 *  each capped to a handful of matches — this backs the Topbar's global
 *  search palette, not a full search results page. */
export async function search(query: string, organizationId?: string): Promise<GlobalSearchResult> {
  if (!query.trim()) {
    return { patients: [], tests: [] };
  }

  const [patientsResult, testsResult] = await Promise.all([
    patientService.listPatients({ search: query, organizationId, pageSize: RESULT_LIMIT }),
    testService.listTests({ search: query, status: "Active", pageSize: RESULT_LIMIT }),
  ]);

  return {
    patients: patientsResult.rows.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      fullName: p.fullName,
      mobile: p.mobile,
    })),
    tests: testsResult.rows.map((t) => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      price: t.price,
    })),
  };
}
