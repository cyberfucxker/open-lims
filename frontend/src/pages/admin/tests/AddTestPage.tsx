import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { TestForm } from "@/components/tests/TestForm";

function AddTestPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Add Test" description="Create a new test for the diagnostic catalogue." />
      <TestForm mode="create" onSuccess={() => navigate("/admin/tests")} />
    </div>
  );
}

export { AddTestPage };
