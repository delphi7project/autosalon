
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import CarDetail from "./pages/CarDetail";
import Financing from "./pages/Financing";
import TestDrive from "./pages/TestDrive";
import Service from "./pages/Service";
import Insurance from "./pages/Insurance";
import TradeIn from "./pages/TradeIn";
import Cart from "./pages/Cart";
import Contacts from "./pages/Contacts";
import About from "./pages/About";
import Warranty from "./pages/Warranty";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/car/:id" element={<CarDetail />} />
            <Route path="/financing" element={<Financing />} />
            <Route path="/test-drive" element={<TestDrive />} />
            <Route path="/service" element={<Service />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/trade-in" element={<TradeIn />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/about" element={<About />} />
            <Route path="/warranty" element={<Warranty />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
