import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Edit,
  Heart,
  Loader2,
  MapPin,
  Pill,
  Stethoscope,
  Thermometer,
  Wind,
  Droplets,
  Weight,
  Ruler,
} from "lucide-react";
import { Link, useParams } from "wouter";

const tipoLabels: Record<string, string> = {
  consulta: "Consulta",
  visita_domiciliar: "Visita Domiciliar",
  procedimento: "Procedimento",
  retorno: "Retorno",
  urgencia: "Urgência",
};

const localLabels: Record<string, string> = {
  ubs: "UBS",
  domicilio: "Domicílio",
  outro: "Outro",
};

export default function AtendimentoDetalhe() {
  const params = useParams<{ id: string }>();
  const atendimentoId = parseInt(params.id);

  const { data: atendimento, isLoading: loadingAtend } = trpc.atendimentos.get.useQuery({
    id: atendimentoId,
  });

  const { data: paciente } = trpc.pacientes.get.useQuery(
    { id: atendimento?.pacienteId ?? 0 },
    { enabled: !!atendimento?.pacienteId }
  );

  const { data: prontuario, isLoading: loadingPront } = trpc.prontuarios.getByAtendimento.useQuery(
    { atendimentoId },
    { enabled: !!atendimentoId }
  );

  const breadcrumbs = [
    { label: "Pacientes", href: "/pacientes" },
    ...(paciente
      ? [{ label: paciente.nome, href: `/pacientes/${paciente.id}/historico` }]
      : []),
    { label: "Detalhe do Atendimento" },
  ];

  if (loadingAtend || loadingPront) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detalhe do Atendimento</h1>
            {atendimento && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {format(new Date(atendimento.dataAtendimento), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
          <Link href={`/atendimentos/${atendimentoId}/prontuario`}>
            <Button className="gap-2">
              <Edit className="w-4 h-4" />
              Editar Prontuário
            </Button>
          </Link>
        </div>

        {/* Atendimento info */}
        {atendimento && (
          <div className="bg-card border border-border rounded-xl p-5 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{tipoLabels[atendimento.tipo ?? "consulta"]}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{localLabels[atendimento.local ?? "ubs"]}</span>
            </div>
          </div>
        )}

        {!prontuario ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">Prontuário não preenchido</p>
            <p className="text-sm text-muted-foreground mb-4">Clique em "Editar Prontuário" para preencher</p>
          </div>
        ) : (
          <>
            {/* Sinais Vitais */}
            {prontuario.sinaisVitais && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Sinais Vitais</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {prontuario.sinaisVitais.pressaoArterial && (
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Pressão Arterial</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.pressaoArterial}</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.frequenciaCardiaca && (
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Activity className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">FC</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.frequenciaCardiaca} bpm</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.temperatura && (
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <Thermometer className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Temperatura</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.temperatura}°C</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.saturacao && (
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Wind className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Saturação</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.saturacao}%</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.glicemia && (
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Droplets className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Glicemia</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.glicemia}</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.peso && (
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Weight className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.peso} kg</p>
                    </div>
                  )}
                  {prontuario.sinaisVitais.altura && (
                    <div className="bg-teal-50 rounded-lg p-3 text-center">
                      <Ruler className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Altura</p>
                      <p className="font-semibold text-foreground">{prontuario.sinaisVitais.altura} cm</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SOAP */}
            <div className="space-y-3">
              {prontuario.subjetivo && (
                <div className="soap-s rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-blue-500 text-white flex items-center justify-center text-xs font-bold">S</span>
                    <h3 className="font-semibold text-sm text-foreground">Subjetivo</h3>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prontuario.subjetivo}</p>
                </div>
              )}
              {prontuario.objetivo && (
                <div className="soap-o rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-green-500 text-white flex items-center justify-center text-xs font-bold">O</span>
                    <h3 className="font-semibold text-sm text-foreground">Objetivo</h3>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prontuario.objetivo}</p>
                </div>
              )}
              {(prontuario.avaliacao || prontuario.diagnosticos?.length > 0) && (
                <div className="soap-a rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center text-xs font-bold">A</span>
                    <h3 className="font-semibold text-sm text-foreground">Avaliação / Diagnóstico</h3>
                  </div>
                  {prontuario.avaliacao && (
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{prontuario.avaliacao}</p>
                  )}
                  {prontuario.diagnosticos?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prontuario.diagnosticos.map((d) => (
                        <div key={d.id} className="flex items-center gap-1.5 bg-orange-100 text-orange-800 rounded-lg px-3 py-1.5 text-sm">
                          <span className="font-mono font-bold text-xs">{d.ciapCodigo}</span>
                          <span>{d.descricao}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {prontuario.plano && (
                <div className="soap-p rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-purple-500 text-white flex items-center justify-center text-xs font-bold">P</span>
                    <h3 className="font-semibold text-sm text-foreground">Plano</h3>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prontuario.plano}</p>
                </div>
              )}
            </div>

            {/* Prescrições */}
            {prontuario.prescricoes?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Prescrições</h2>
                </div>
                <div className="space-y-2">
                  {prontuario.prescricoes.map((p) => (
                    <div key={p.id} className="bg-muted/50 rounded-lg px-4 py-3">
                      <p className="font-semibold text-foreground text-sm">{p.medicamento}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.dosagem && <Badge variant="secondary" className="text-xs">{p.dosagem}</Badge>}
                        {p.frequencia && <Badge variant="secondary" className="text-xs">{p.frequencia}</Badge>}
                        {p.duracao && <Badge variant="secondary" className="text-xs">{p.duracao}</Badge>}
                      </div>
                      {p.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
