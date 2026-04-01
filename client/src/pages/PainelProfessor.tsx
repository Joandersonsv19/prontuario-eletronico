import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  Copy,
  RefreshCw,
  Loader2,
  Eye,
  WifiOff,
  Clock,
  Activity,
  ClipboardList,
  Pill,
  Stethoscope,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Weight,
  Ruler,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSocket } from "@/hooks/useSocket";
import type { AlunoInfo, ProntuarioUpdate } from "../../../server/socketSupervision";

// ─── Visualizador do prontuário do aluno (somente leitura) ────────────────────
function ProntuarioViewer({ update }: { update: ProntuarioUpdate }) {
  const soapSections = [
    {
      key: "S",
      label: "Subjetivo",
      value: update.soap.subjetivo,
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-500",
    },
    {
      key: "O",
      label: "Objetivo",
      value: update.soap.objetivo,
      color: "bg-green-50 border-green-200",
      badge: "bg-green-500",
    },
    {
      key: "A",
      label: "Avaliação",
      value: update.soap.avaliacao,
      color: "bg-orange-50 border-orange-200",
      badge: "bg-orange-500",
    },
    {
      key: "P",
      label: "Plano",
      value: update.soap.plano,
      color: "bg-purple-50 border-purple-200",
      badge: "bg-purple-500",
    },
  ];

  const sinaisFields = [
    { icon: <Heart className="w-3.5 h-3.5 text-red-500" />, label: "PA", value: update.sinaisVitais.pressaoArterial },
    { icon: <Activity className="w-3.5 h-3.5 text-orange-500" />, label: "FC", value: update.sinaisVitais.frequenciaCardiaca },
    { icon: <Thermometer className="w-3.5 h-3.5 text-yellow-500" />, label: "Temp", value: update.sinaisVitais.temperatura },
    { icon: <Wind className="w-3.5 h-3.5 text-blue-500" />, label: "Sat", value: update.sinaisVitais.saturacao },
    { icon: <Droplets className="w-3.5 h-3.5 text-purple-500" />, label: "Glicemia", value: update.sinaisVitais.glicemia },
    { icon: <Weight className="w-3.5 h-3.5 text-green-500" />, label: "Peso", value: update.sinaisVitais.peso },
    { icon: <Ruler className="w-3.5 h-3.5 text-teal-500" />, label: "Altura", value: update.sinaisVitais.altura },
  ].filter((f) => f.value && f.value.trim() !== "");

  return (
    <div className="space-y-4">
      {/* Cabeçalho do atendimento */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">
            Paciente: {update.pacienteNome || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            Atendimento #{update.atendimentoId} · Última atualização:{" "}
            {format(new Date(update.timestamp), "HH:mm:ss", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Ao vivo
        </Badge>
      </div>

      {/* Sinais Vitais */}
      {sinaisFields.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            SINAIS VITAIS
          </p>
          <div className="flex flex-wrap gap-2">
            {sinaisFields.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
                {f.icon}
                <span className="text-muted-foreground text-xs">{f.label}:</span>
                <span className="font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOAP */}
      <div className="space-y-2">
        {soapSections.map((s) => (
          <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-6 h-6 rounded-md ${s.badge} text-white flex items-center justify-center text-xs font-bold`}>
                {s.key}
              </span>
              <span className="font-semibold text-sm">{s.label}</span>
            </div>
            {s.value ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{s.value}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">Não preenchido</p>
            )}
          </div>
        ))}
      </div>

      {/* Diagnósticos CIAP-2 */}
      {update.diagnosticos.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            DIAGNÓSTICOS CIAP-2
          </p>
          <div className="flex flex-wrap gap-2">
            {update.diagnosticos.map((d, i) => (
              <Badge key={i} variant="secondary" className="gap-1.5">
                <span className="font-mono font-bold">{d.ciapCodigo}</span>
                {d.descricao}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Prescrições */}
      {update.prescricoes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" />
            PRESCRIÇÕES
          </p>
          <div className="space-y-2">
            {update.prescricoes.map((p, i) => (
              <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                <Stethoscope className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{p.medicamento}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.dosagem, p.frequencia, p.duracao].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações */}
      {update.observacoes && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            OBSERVAÇÕES GERAIS
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{update.observacoes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Painel Principal do Professor ───────────────────────────────────────────
export default function PainelProfessor() {
  const utils = trpc.useUtils();
  const [alunoSelecionado, setAlunoSelecionado] = useState<number | null>(null);
  const [alunosConectados, setAlunosConectados] = useState<AlunoInfo[]>([]);
  const [prontuariosAoVivo, setProntuariosAoVivo] = useState<
    Record<number, { alunoNome: string; update: ProntuarioUpdate }>
  >({});

  // Dados tRPC
  const { data: codigos, isLoading: loadingCodigos } = trpc.supervisao.listarCodigos.useQuery();
  const { data: historico } = trpc.supervisao.historicoSessoes.useQuery();

  const gerarCodigoMutation = trpc.supervisao.gerarCodigo.useMutation({
    onSuccess: () => {
      toast.success("Novo código de convite gerado!");
      utils.supervisao.listarCodigos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const revogarMutation = trpc.supervisao.revogarCodigo.useMutation({
    onSuccess: () => {
      toast.success("Código revogado.");
      utils.supervisao.listarCodigos.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Socket.io: entrar na sala do professor e escutar eventos
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit("professor:entrar_sala");
    };

    if (socket.connected) {
      socket.emit("professor:entrar_sala");
    } else {
      socket.once("connect", onConnect);
    }

    socket.on("professor:lista_alunos", (lista: AlunoInfo[]) => {
      setAlunosConectados(lista);
    });

    socket.on("professor:aluno_conectado", (aluno: AlunoInfo) => {
      setAlunosConectados((prev) => {
        const exists = prev.find((a) => a.alunoId === aluno.alunoId);
        if (exists) return prev.map((a) => (a.alunoId === aluno.alunoId ? aluno : a));
        return [...prev, aluno];
      });
      toast.success(`Aluno ${aluno.alunoNome} conectou-se à supervisão.`);
    });

    socket.on("professor:aluno_desconectado", ({ alunoId }: { alunoId: number }) => {
      setAlunosConectados((prev) => prev.filter((a) => a.alunoId !== alunoId));
      setProntuariosAoVivo((prev) => {
        const next = { ...prev };
        delete next[alunoId];
        return next;
      });
      if (alunoSelecionado === alunoId) setAlunoSelecionado(null);
      toast.info("Um aluno desconectou-se da supervisão.");
    });

    socket.on(
      "professor:prontuario_update",
      (data: { alunoId: number; alunoNome: string; update: ProntuarioUpdate }) => {
        setProntuariosAoVivo((prev) => ({
          ...prev,
          [data.alunoId]: { alunoNome: data.alunoNome, update: data.update },
        }));
      }
    );

    return () => {
      socket.off("connect", onConnect);
      socket.off("professor:lista_alunos");
      socket.off("professor:aluno_conectado");
      socket.off("professor:aluno_desconectado");
      socket.off("professor:prontuario_update");
    };
  }, [alunoSelecionado]);

  const handleSelecionarAluno = (alunoId: number) => {
    setAlunoSelecionado(alunoId);
    // Solicitar estado atual
    const socket = getSocket();
    socket.emit("professor:solicitar_estado", { alunoId });
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado!");
  };

  const breadcrumbs = [{ label: "Painel do Professor" }];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              Painel de Supervisão
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Acompanhe os atendimentos dos seus alunos em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            {alunosConectados.length > 0 ? (
              <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {alunosConectados.length} aluno{alunosConectados.length > 1 ? "s" : ""} conectado{alunosConectados.length > 1 ? "s" : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <WifiOff className="w-3 h-3" />
                Nenhum aluno conectado
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Códigos + Alunos */}
          <div className="space-y-4">
            {/* Códigos de convite */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    Códigos de Convite
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => gerarCodigoMutation.mutate()}
                    disabled={gerarCodigoMutation.isPending}
                  >
                    {gerarCodigoMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Gerar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingCodigos ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : codigos && codigos.length > 0 ? (
                  codigos.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-mono font-bold text-primary tracking-widest text-sm">
                          {c.codigo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(c.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => copiarCodigo(c.codigo)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Copiar código"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => revogarMutation.mutate({ codigo: c.codigo })}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          title="Revogar código"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhum código ativo. Gere um para compartilhar com seus alunos.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Alunos conectados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Alunos Conectados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alunosConectados.length === 0 ? (
                  <div className="text-center py-6">
                    <WifiOff className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Aguardando alunos conectarem usando o código de convite.
                    </p>
                  </div>
                ) : (
                  alunosConectados.map((aluno) => {
                    const temUpdate = !!prontuariosAoVivo[aluno.alunoId];
                    const isSelected = alunoSelecionado === aluno.alunoId;
                    return (
                      <button
                        key={aluno.alunoId}
                        onClick={() => handleSelecionarAluno(aluno.alunoId)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/50 hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                            {aluno.alunoNome.charAt(0).toUpperCase()}
                          </div>
                          {temUpdate && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{aluno.alunoNome}</p>
                          <p className="text-xs text-muted-foreground">
                            {temUpdate ? (
                              <span className="text-emerald-600">Editando prontuário</span>
                            ) : (
                              "Conectado"
                            )}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Histórico de sessões */}
            {historico && historico.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Histórico de Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {historico.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{s.alunoNome ?? `Aluno #${s.alunoId}`}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(s.iniciadaEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {s.duracaoSegundos != null && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(s.duracaoSegundos / 60)}min
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna direita: Prontuário ao vivo */}
          <div className="lg:col-span-2">
            {alunoSelecionado && prontuariosAoVivo[alunoSelecionado] ? (
              <Card className="h-full">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Prontuário de{" "}
                    <span className="text-primary">
                      {prontuariosAoVivo[alunoSelecionado].alunoNome}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs text-emerald-700 border-emerald-300 bg-emerald-50 gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Somente leitura
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto max-h-[calc(100vh-280px)]">
                  <ProntuarioViewer update={prontuariosAoVivo[alunoSelecionado].update} />
                </CardContent>
              </Card>
            ) : alunoSelecionado ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <Loader2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Aguardando atualização do prontuário...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O prontuário aparecerá assim que o aluno começar a preencher.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Selecione um aluno para acompanhar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                    Compartilhe um código de convite com seus alunos e selecione um da lista para
                    visualizar o prontuário em tempo real.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
