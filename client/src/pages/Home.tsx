import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, ClipboardList, Users, Shield, Search } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/pacientes");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-tight">Prontuário Eletrônico</p>
              <p className="text-xs text-muted-foreground leading-tight">Atenção Básica</p>
            </div>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Stethoscope className="w-4 h-4" />
            Sistema para Atenção Básica em Saúde
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Prontuário Eletrônico<br />
            <span className="text-primary">Completo e Seguro</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Gerencie pacientes, atendimentos e prontuários clínicos seguindo o modelo SOAP com integração completa à CIAP-2.
          </p>
          <Button asChild size="lg" className="px-8">
            <a href={getLoginUrl()}>Começar agora</a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">Funcionalidades principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Gestão de Pacientes",
                desc: "Cadastro completo com CPF, CNS, dados pessoais e histórico de atendimentos.",
              },
              {
                icon: ClipboardList,
                title: "Prontuário SOAP",
                desc: "Registro estruturado com Subjetivo, Objetivo, Avaliação e Plano clínico.",
              },
              {
                icon: Search,
                title: "CIAP-2 Integrado",
                desc: "Busca inteligente por palavras-chave com 683 códigos da classificação CIAP-2.",
              },
              {
                icon: Stethoscope,
                title: "Sinais Vitais",
                desc: "Registro de PA, FC, temperatura, saturação, glicemia, peso e altura.",
              },
              {
                icon: ClipboardList,
                title: "Prescrições",
                desc: "Módulo de prescrição com medicamento, dosagem, frequência e duração.",
              },
              {
                icon: Shield,
                title: "Isolamento de Dados",
                desc: "Cada profissional acessa apenas seus próprios pacientes e registros.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-xl border border-border bg-background hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-sm text-muted-foreground">
        Prontuário Eletrônico — Sistema para Atenção Básica em Saúde
      </footer>
    </div>
  );
}
