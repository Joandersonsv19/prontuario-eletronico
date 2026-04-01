import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronRight, Loader2, Plus, Search, User, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

function calcIdade(dataNascimento: Date | string | null) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function Pacientes() {
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  const { data: pacientes, isLoading } = trpc.pacientes.list.useQuery(
    { busca: buscaDebounced || undefined },
    { refetchOnWindowFocus: false }
  );

  const handleBusca = (value: string) => {
    setBusca(value);
    clearTimeout((window as any)._buscaTimer);
    (window as any)._buscaTimer = setTimeout(() => setBuscaDebounced(value), 300);
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Pacientes" }]}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pacientes ? `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""} cadastrado${pacientes.length !== 1 ? "s" : ""}` : "Carregando..."}
            </p>
          </div>
          <Link href="/pacientes/novo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Paciente
            </Button>
          </Link>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou CNS..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !pacientes || pacientes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {buscaDebounced ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {buscaDebounced
                ? `Não encontramos resultados para "${buscaDebounced}"`
                : "Comece cadastrando seu primeiro paciente"}
            </p>
            {!buscaDebounced && (
              <Link href="/pacientes/novo">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Paciente
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {pacientes.map((p) => {
              const idade = calcIdade(p.dataNascimento);
              return (
                <Link key={p.id} href={`/pacientes/${p.id}/historico`}>
                  <a className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{p.nome}</p>
                        {p.sexo && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {p.sexo}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {idade !== null && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {idade} anos
                          </span>
                        )}
                        {p.cpf && <span>CPF: {p.cpf}</span>}
                        {p.cns && <span>CNS: {p.cns}</span>}
                        {p.telefone && <span>{p.telefone}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
