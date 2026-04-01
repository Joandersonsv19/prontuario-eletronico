import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import PacienteForm from "./pages/PacienteForm";
import PacienteHistorico from "./pages/PacienteHistorico";
import NovoAtendimento from "./pages/NovoAtendimento";
import Prontuario from "./pages/Prontuario";
import AtendimentoDetalhe from "./pages/AtendimentoDetalhe";
import PainelProfessor from "./pages/PainelProfessor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/pacientes/novo" component={PacienteForm} />
      <Route path="/pacientes/:id/editar" component={PacienteForm} />
      <Route path="/pacientes/:id/historico" component={PacienteHistorico} />
      <Route path="/pacientes/:pacienteId/atendimentos/novo" component={NovoAtendimento} />
      <Route path="/atendimentos/:id/prontuario" component={Prontuario} />
      <Route path="/atendimentos/:id/detalhe" component={AtendimentoDetalhe} />
      <Route path="/supervisao" component={PainelProfessor} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
