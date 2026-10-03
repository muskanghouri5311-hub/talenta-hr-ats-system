import { BrowserRouter } from "react-router-dom";

import { Toaster } from "sonner";
import MainRoutes from "./routes/MainRoutes";

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        richColors
      />

      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;