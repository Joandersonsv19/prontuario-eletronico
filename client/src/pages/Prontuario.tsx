import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  ClipboardList,
  Loader2,
  Plus,
  Save,
  Search,
  Stethoscope,
  Thermometer,
  Trash2,
  X,
  Pill,
  Heart,
  Wind,
  Droplets,
  Weight,
  Ruler,
  FileDown,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SupervisaoWidget } from "@/components/SupervisaoWidget";
import { useSupervisaoAluno } from "@/hooks/useSupervisaoAluno";

// ─── CIAP-2 Search Component ──────────────────────────────────────────────────
interface Ciap2Item {
  codigo: string;
  descricao: string;
}

interface DiagnosticoItem {
  ciapCodigo: string;
  descricao: string;
  observacao?: string;
}

function Ciap2Search({
  diagnosticos,
  onAdd,
  onRemove,
}: {
  diagnosticos: DiagnosticoItem[];
  onAdd: (item: DiagnosticoItem) => void;
  onRemove: (codigo: string) => void;
}) {
  const [termo, setTermo] = useState("");
  const [termoDebounced, setTermoDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const timerRef = useRef<any>(null);

  const { data: resultados, isLoading } = trpc.ciap2.search.useQuery(
    { termo: termoDebounced, limit: 8 },
    { enabled: termoDebounced.length >= 2 }
  );

  const handleInput = (v: string) => {
    setTermo(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTermoDebounced(v);
      setOpen(v.length >= 2);
    }, 300);
  };

  const handleSelect = (item: Ciap2Item) => {
    if (!diagnosticos.find((d) => d.ciapCodigo === item.codigo)) {
      onAdd({ ciapCodigo: item.codigo, descricao: item.descricao });
    }
    setTermo("");
    setTermoDebounced("");
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected diagnosticos */}
      {diagnosticos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {diagnosticos.map((d) => (
            <div
              key={d.ciapCodigo}
              className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm"
            >
              <span className="font-mono font-semibold text-xs">{d.ciapCodigo}</span>
              <span className="max-w-[200px] truncate">{d.descricao}</span>
              <button
                type="button"
                onClick={() => onRemove(d.ciapCodigo)}
                className="text-primary/60 hover:text-primary ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={termo}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Buscar diagnóstico CIAP-2 (ex: hipertensão, diabetes, tosse...)"
          className="pl-9"
          onFocus={() => termo.length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}

        {/* Dropdown */}
        {open && resultados && resultados.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {resultados.map((item) => {
              const alreadyAdded = diagnosticos.some((d) => d.ciapCodigo === item.codigo);
              return (
                <button
                  key={item.codigo}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors",
                    alreadyAdded && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !alreadyAdded && handleSelect(item)}
                >
                  <span className="font-mono font-bold text-primary text-xs w-10 flex-shrink-0">
                    {item.codigo}
                  </span>
                  <span className="text-foreground">{item.descricao}</span>
                  {alreadyAdded && (
                    <span className="ml-auto text-xs text-muted-foreground">Adicionado</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {open && termoDebounced.length >= 2 && !isLoading && resultados?.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 px-4 py-3 text-sm text-muted-foreground">
            Nenhum resultado para "{termoDebounced}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Prescrição Form ──────────────────────────────────────────────────────────
interface PrescricaoItem {
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  observacoes: string;
}

function PrescricaoForm({ onAdd }: { onAdd: (item: PrescricaoItem) => void }) {
  const [form, setForm] = useState<PrescricaoItem>({
    medicamento: "",
    dosagem: "",
    frequencia: "",
    duracao: "",
    observacoes: "",
  });
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!form.medicamento.trim()) {
      toast.error("Informe o nome do medicamento");
      return;
    }
    onAdd(form);
    setForm({ medicamento: "", dosagem: "", frequencia: "", duracao: "", observacoes: "" });
    setOpen(false);
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Adicionar Medicamento
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <Label>Medicamento *</Label>
          <Input
            value={form.medicamento}
            onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
            placeholder="Nome do medicamento"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Dosagem</Label>
          <Input
            value={form.dosagem}
            onChange={(e) => setForm({ ...form, dosagem: e.target.value })}
            placeholder="Ex: 500mg"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Frequência</Label>
          <Input
            value={form.frequencia}
            onChange={(e) => setForm({ ...form, frequencia: e.target.value })}
            placeholder="Ex: 8/8h, 1x ao dia"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Duração</Label>
          <Input
            value={form.duracao}
            onChange={(e) => setForm({ ...form, duracao: e.target.value })}
            placeholder="Ex: 7 dias, uso contínuo"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Observações</Label>
          <Input
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Ex: tomar após refeição"
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Prontuario Page ─────────────────────────────────────────────────────
export default function Prontuario() {
  const params = useParams<{ id: string }>();
  const atendimentoId = parseInt(params.id);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: atendimento, isLoading: loadingAtend } = trpc.atendimentos.get.useQuery({
    id: atendimentoId,
  });

  const { data: paciente } = trpc.pacientes.get.useQuery(
    { id: atendimento?.pacienteId ?? 0 },
    { enabled: !!atendimento?.pacienteId }
  );

  const { data: prontuario, isLoading: loadingPront } = trpc.prontuarios.getByAtendimento.useQuery(
    { atendimentoId },
    { refetchOnWindowFocus: false }
  );

  // SOAP fields
  const [soap, setSoap] = useState({
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
  });

  // Sinais vitais
  const [sinais, setSinais] = useState({
    pressaoArterial: "",
    frequenciaCardiaca: "" as string | number,
    temperatura: "",
    saturacao: "" as string | number,
    glicemia: "",
    peso: "",
    altura: "",
  });

  // Diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);

  // Prescrições (novos a adicionar)
  const [novasPrescricoes, setNovasPrescricoes] = useState<PrescricaoItem[]>([]);
  // Prescrições existentes
  const [prescricoesExistentes, setPrescricoesExistentes] = useState<any[]>([]);

  // Populate form when prontuario loads
  useEffect(() => {
    if (prontuario) {
      setSoap({
        subjetivo: prontuario.subjetivo ?? "",
        objetivo: prontuario.objetivo ?? "",
        avaliacao: prontuario.avaliacao ?? "",
        plano: prontuario.plano ?? "",
      });
      if (prontuario.sinaisVitais) {
        const sv = prontuario.sinaisVitais;
        setSinais({
          pressaoArterial: sv.pressaoArterial ?? "",
          frequenciaCardiaca: sv.frequenciaCardiaca ?? "",
          temperatura: sv.temperatura ?? "",
          saturacao: sv.saturacao ?? "",
          glicemia: sv.glicemia ?? "",
          peso: sv.peso ?? "",
          altura: sv.altura ?? "",
        });
      }
      if (prontuario.diagnosticos) {
        setDiagnosticos(
          prontuario.diagnosticos.map((d) => ({
            ciapCodigo: d.ciapCodigo,
            descricao: d.descricao,
            observacao: d.observacao ?? undefined,
          }))
        );
      }
      if (prontuario.prescricoes) {
        setPrescricoesExistentes(prontuario.prescricoes);
      }
    }
  }, [prontuario]);

  const saveMutation = trpc.prontuarios.save.useMutation({
    onSuccess: () => {
      toast.success("Prontuário salvo com sucesso!");
      setNovasPrescricoes([]);
      utils.prontuarios.getByAtendimento.invalidate({ atendimentoId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePrescricaoMutation = trpc.prontuarios.deletePrescricao.useMutation({
    onSuccess: () => {
      toast.success("Medicamento removido");
      utils.prontuarios.getByAtendimento.invalidate({ atendimentoId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateObsMutation = trpc.atendimentos.updateObservacoes.useMutation({
    onSuccess: () => toast.success("Observações salvas!"),
    onError: (e) => toast.error(e.message),
  });

  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (atendimento?.observacoes) setObservacoes(atendimento.observacoes);
  }, [atendimento]);

  // Supervisão acadêmica
  const { data: conexaoAtiva } = trpc.supervisao.minhaConexao.useQuery();
  const professorId = conexaoAtiva?.ativa === 1 ? conexaoAtiva.professorId : null;
  const { emitirUpdate } = useSupervisaoAluno(professorId);

  // Emitir atualizações em tempo real sempre que o conteúdo mudar
  const emitirUpdateDebounced = useCallback(() => {
    if (!professorId) return;
    emitirUpdate({
      atendimentoId,
      soap,
      sinaisVitais: {
        pressaoArterial: String(sinais.pressaoArterial ?? ""),
        frequenciaCardiaca: String(sinais.frequenciaCardiaca ?? ""),
        temperatura: String(sinais.temperatura ?? ""),
        saturacao: String(sinais.saturacao ?? ""),
        glicemia: String(sinais.glicemia ?? ""),
        peso: String(sinais.peso ?? ""),
        altura: String(sinais.altura ?? ""),
      },
      diagnosticos,
      prescricoes: [
        ...prescricoesExistentes.map((p) => ({
          medicamento: p.medicamento,
          dosagem: p.dosagem ?? "",
          frequencia: p.frequencia ?? "",
          duracao: p.duracao ?? "",
        })),
        ...novasPrescricoes.map((p) => ({
          medicamento: p.medicamento,
          dosagem: p.dosagem ?? "",
          frequencia: p.frequencia ?? "",
          duracao: p.duracao ?? "",
        })),
      ],
      observacoes,
      pacienteNome: paciente?.nome ?? "",
    });
  }, [professorId, atendimentoId, soap, sinais, diagnosticos, prescricoesExistentes, novasPrescricoes, observacoes, paciente, emitirUpdate]);

  // Debounce de 1 segundo para não sobrecarregar o socket
  const debounceRef = useRef<any>(null);
  useEffect(() => {
    if (!professorId) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(emitirUpdateDebounced, 1000);
    return () => clearTimeout(debounceRef.current);
  }, [soap, sinais, diagnosticos, observacoes, professorId, emitirUpdateDebounced]);

  const handleDownloadPdf = () => {
    window.open(`/api/prontuario/${atendimentoId}/pdf`, "_blank");
  };

  const handleSave = () => {
    const strOrUndef = (v: string | number) =>
      v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : undefined;
    saveMutation.mutate({
      atendimentoId,
      subjetivo: soap.subjetivo || undefined,
      objetivo: soap.objetivo || undefined,
      avaliacao: soap.avaliacao || undefined,
      plano: soap.plano || undefined,
      sinaisVitais: {
        pressaoArterial: strOrUndef(sinais.pressaoArterial),
        frequenciaCardiaca: strOrUndef(sinais.frequenciaCardiaca),
        temperatura: strOrUndef(sinais.temperatura),
        saturacao: strOrUndef(sinais.saturacao),
        glicemia: strOrUndef(sinais.glicemia),
        peso: strOrUndef(sinais.peso),
        altura: strOrUndef(sinais.altura),
      },
      diagnosticos,
      prescricoes: novasPrescricoes.length > 0 ? novasPrescricoes : undefined,
    });
  };

  const breadcrumbs = [
    { label: "Pacientes", href: "/pacientes" },
    ...(paciente
      ? [{ label: paciente.nome, href: `/pacientes/${paciente.id}/historico` }]
      : []),
    { label: "Prontuário" },
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
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prontuário Clínico</h1>
            {atendimento && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(new Date(atendimento.dataAtendimento), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
                {" · "}
                {atendimento.tipo === "consulta" ? "Consulta" :
                  atendimento.tipo === "visita_domiciliar" ? "Visita Domiciliar" :
                  atendimento.tipo === "procedimento" ? "Procedimento" :
                  atendimento.tipo === "retorno" ? "Retorno" : "Urgência"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <SupervisaoWidget />
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="gap-2"
              title="Baixar prontuário em PDF"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Prontuário
            </Button>
          </div>
        </div>

        {/* Sinais Vitais */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Sinais Vitais</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                Pressão Arterial
              </Label>
              <Input
                value={sinais.pressaoArterial}
                onChange={(e) => setSinais({ ...sinais, pressaoArterial: e.target.value })}
                placeholder="Ex: 120/80"
                title="Formato: sistólica/diastólica (ex: 120/80)"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
                FC (bpm)
              </Label>
              <Input
                value={sinais.frequenciaCardiaca}
                onChange={(e) => setSinais({ ...sinais, frequenciaCardiaca: e.target.value })}
                placeholder="Ex: 72 bpm"
                title="Frequência cardíaca em batimentos por minuto"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Thermometer className="w-3.5 h-3.5 text-yellow-500" />
                Temperatura (°C)
              </Label>
              <Input
                value={sinais.temperatura}
                onChange={(e) => setSinais({ ...sinais, temperatura: e.target.value })}
                placeholder="Ex: 36,5 °C"
                title="Temperatura corporal em graus Celsius"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Wind className="w-3.5 h-3.5 text-blue-500" />
                Saturação (%)
              </Label>
              <Input
                value={sinais.saturacao}
                onChange={(e) => setSinais({ ...sinais, saturacao: e.target.value })}
                placeholder="Ex: 98%"
                title="Saturação de oxigênio em porcentagem"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Droplets className="w-3.5 h-3.5 text-purple-500" />
                Glicemia
              </Label>
              <Input
                value={sinais.glicemia}
                onChange={(e) => setSinais({ ...sinais, glicemia: e.target.value })}
                placeholder="Ex: 100 mg/dL"
                title="Glicemia capilar em mg/dL (pode incluir: jejum, pós-prandial)"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Weight className="w-3.5 h-3.5 text-green-500" />
                Peso (kg)
              </Label>
              <Input
                value={sinais.peso}
                onChange={(e) => setSinais({ ...sinais, peso: e.target.value })}
                placeholder="Ex: 70,5 kg"
                title="Peso corporal em quilogramas"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs">
                <Ruler className="w-3.5 h-3.5 text-teal-500" />
                Altura (cm)
              </Label>
              <Input
                value={sinais.altura}
                onChange={(e) => setSinais({ ...sinais, altura: e.target.value })}
                placeholder="Ex: 170 cm"
                title="Altura em centímetros"
                className="mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SOAP */}
        <div className="space-y-3">
          {/* S - Subjetivo */}
          <div className="soap-s rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">S</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Subjetivo</h3>
                <p className="text-xs text-muted-foreground">Queixa principal, história da doença atual, sintomas relatados pelo paciente</p>
              </div>
            </div>
            <Textarea
              value={soap.subjetivo}
              onChange={(e) => setSoap({ ...soap, subjetivo: e.target.value })}
              placeholder="Descreva a queixa principal e os sintomas relatados pelo paciente..."
              rows={4}
              className="bg-white/70 border-blue-200 focus:border-blue-400 resize-none"
            />
          </div>

          {/* O - Objetivo */}
          <div className="soap-o rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">O</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Objetivo</h3>
                <p className="text-xs text-muted-foreground">Dados do exame físico, resultados de exames, observações clínicas mensuráveis</p>
              </div>
            </div>
            <Textarea
              value={soap.objetivo}
              onChange={(e) => setSoap({ ...soap, objetivo: e.target.value })}
              placeholder="Descreva os achados do exame físico e dados objetivos..."
              rows={4}
              className="bg-white/70 border-green-200 focus:border-green-400 resize-none"
            />
          </div>

          {/* A - Avaliação / Diagnóstico */}
          <div className="soap-a rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">A</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Avaliação / Diagnóstico</h3>
                <p className="text-xs text-muted-foreground">Impressão diagnóstica, hipóteses, classificação CIAP-2</p>
              </div>
            </div>
            <Textarea
              value={soap.avaliacao}
              onChange={(e) => setSoap({ ...soap, avaliacao: e.target.value })}
              placeholder="Descreva a avaliação clínica e impressão diagnóstica..."
              rows={3}
              className="bg-white/70 border-orange-200 focus:border-orange-400 resize-none mb-3"
            />

            {/* CIAP-2 */}
            <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
              <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Diagnósticos CIAP-2
              </p>
              <Ciap2Search
                diagnosticos={diagnosticos}
                onAdd={(d) => setDiagnosticos([...diagnosticos, d])}
                onRemove={(codigo) =>
                  setDiagnosticos(diagnosticos.filter((d) => d.ciapCodigo !== codigo))
                }
              />
            </div>
          </div>

          {/* P - Plano */}
          <div className="soap-p rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">P</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Plano</h3>
                <p className="text-xs text-muted-foreground">Conduta terapêutica, encaminhamentos, orientações ao paciente</p>
              </div>
            </div>
            <Textarea
              value={soap.plano}
              onChange={(e) => setSoap({ ...soap, plano: e.target.value })}
              placeholder="Descreva a conduta, tratamento e orientações..."
              rows={4}
              className="bg-white/70 border-purple-200 focus:border-purple-400 resize-none"
            />
          </div>
        </div>

        {/* Prescrições */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Prescrições</h2>
          </div>

          {/* Existing prescriptions */}
          {prescricoesExistentes.length > 0 && (
            <div className="space-y-2 mb-4">
              {prescricoesExistentes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 bg-muted/50 rounded-lg px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{p.medicamento}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.dosagem && (
                        <Badge variant="secondary" className="text-xs">{p.dosagem}</Badge>
                      )}
                      {p.frequencia && (
                        <Badge variant="secondary" className="text-xs">{p.frequencia}</Badge>
                      )}
                      {p.duracao && (
                        <Badge variant="secondary" className="text-xs">{p.duracao}</Badge>
                      )}
                    </div>
                    {p.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      deletePrescricaoMutation.mutate({ id: p.id, atendimentoId })
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New prescriptions to be added */}
          {novasPrescricoes.length > 0 && (
            <div className="space-y-2 mb-4">
              {novasPrescricoes.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">{p.medicamento}</p>
                      <Badge className="text-xs bg-primary/20 text-primary border-0">Novo</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.dosagem && <Badge variant="secondary" className="text-xs">{p.dosagem}</Badge>}
                      {p.frequencia && <Badge variant="secondary" className="text-xs">{p.frequencia}</Badge>}
                      {p.duracao && <Badge variant="secondary" className="text-xs">{p.duracao}</Badge>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNovasPrescricoes(novasPrescricoes.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <PrescricaoForm
            onAdd={(item) => setNovasPrescricoes([...novasPrescricoes, item])}
          />
        </div>

        {/* Observações Gerais do Atendimento */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Observações Gerais</h2>
              <p className="text-xs text-muted-foreground">Retorno agendado, encaminhamentos, anotações rápidas do atendimento</p>
            </div>
          </div>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Retorno em 30 dias. Encaminhado para cardiologista. Orientado sobre dieta hipossódica..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={updateObsMutation.isPending}
              onClick={() => updateObsMutation.mutate({ id: atendimentoId, observacoes })}
            >
              {updateObsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar Observações
            </Button>
          </div>
        </div>

        {/* Bottom save button */}
        <div className="flex justify-between items-center pb-6">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg" className="gap-2">
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Prontuário
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
