import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const tipoColors: Record<string, string> = {
  consulta: "bg-blue-100 text-blue-800",
  visita_domiciliar: "bg-green-100 text-green-800",
  procedimento: "bg-orange-100 text-orange-800",
  retorno: "bg-purple-100 text-purple-800",
  urgencia: "bg-red-100 text-red-800",
};

function calcIdade(dataNascimento: Date | string | null) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function PacienteHistorico() {
  const params = useParams<{ id: string }>();
  const pacienteId = parseInt(params.id);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: paciente, isLoading: loadingPaciente } = trpc.pacientes.get.useQuery({ id: pacienteId });
  const { data: atendimentos, isLoading: loadingAtendimentos } = trpc.atendimentos.list.useQuery(
    { pacienteId },
    { enabled: !!pacienteId }
  );

  const deleteMutation = trpc.atendimentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Atendimento removido");
      utils.atendimentos.list.invalidate({ pacienteId });
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePacienteMutation = trpc.pacientes.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente removido");
      utils.pacientes.list.invalidate();
      navigate("/pacientes");
    },
    onError: (e) => toast.error(e.message),
  });

  const breadcrumbs = [
    { label: "Pacientes", href: "/pacientes" },
    { label: paciente?.nome ?? "Carregando..." },
  ];

  if (loadingPaciente) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!paciente) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Paciente não encontrado</p>
          <Button variant="link" onClick={() => navigate("/pacientes")}>
            Voltar para pacientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const idade = calcIdade(paciente.dataNascimento);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Card do paciente */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{paciente.nome}</h1>
                {paciente.sexo && (
                  <Badge variant="secondary" className="capitalize">{paciente.sexo}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                {idade !== null && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {idade} anos
                    {paciente.dataNascimento && (
                      <span className="text-xs">
                        ({format(new Date(paciente.dataNascimento), "dd/MM/yyyy")})
                      </span>
                    )}
                  </span>
                )}
                {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
                {paciente.cns && <span>CNS: {paciente.cns}</span>}
                {paciente.telefone && <span>{paciente.telefone}</span>}
                {paciente.nomeMae && <span>Mãe: {paciente.nomeMae}</span>}
                {paciente.endereco && (
                  <span className="col-span-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {paciente.endereco}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/pacientes/${pacienteId}/editar`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover paciente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os atendimentos e prontuários de{" "}
                      <strong>{paciente.nome}</strong> serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deletePacienteMutation.mutate({ id: pacienteId })}
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Atendimentos */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Histórico de Atendimentos</h2>
          <Link href={`/pacientes/${pacienteId}/atendimentos/novo`}>
            <Button className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Novo Atendimento
            </Button>
          </Link>
        </div>

        {loadingAtendimentos ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !atendimentos || atendimentos.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">Nenhum atendimento registrado</p>
            <p className="text-sm text-muted-foreground mb-4">Registre o primeiro atendimento deste paciente</p>
            <Link href={`/pacientes/${pacienteId}/atendimentos/novo`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Atendimento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {atendimentos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoColors[a.tipo ?? "consulta"]}`}>
                      {tipoLabels[a.tipo ?? "consulta"]}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {localLabels[a.local ?? "ubs"]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {format(new Date(a.dataAtendimento), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/atendimentos/${a.id}/prontuario`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Prontuário
                    </Button>
                  </Link>
                  <Link href={`/atendimentos/${a.id}/detalhe`}>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover atendimento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O prontuário e todos os dados associados a este atendimento serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => deleteMutation.mutate({ id: a.id })}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
