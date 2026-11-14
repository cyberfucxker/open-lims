import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster } from "sonner";

import { queryClient } from "@/providers/queryClient";
import { AuthProvider } from "@/providers/AuthProvider";
import { AppRoutes } from "@/routes/AppRoutes";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <HotToaster
          position="top-right"
          toastOptions={{
            className: "rounded-xl border border-border bg-card text-card-foreground shadow-2xl",
            duration: 3500,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
