import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function NovoAtendimento() {
  const params = useParams<{ pacienteId: string }>();
  const pacienteId = parseInt(params.pacienteId);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: paciente } = trpc.pacientes.get.useQuery({ id: pacienteId });

  const [form, setForm] = useState({
    tipo: "consulta" as "consulta" | "visita_domiciliar" | "procedimento" | "retorno" | "urgencia",
    local: "ubs" as "ubs" | "domicilio" | "outro",
    dataAtendimento: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const createMutation = trpc.atendimentos.create.useMutation({
    onSuccess: () => {
      toast.success("Atendimento criado! Abrindo prontuário...");
      utils.atendimentos.list.invalidate({ pacienteId });
      // Navigate back to patient history
      navigate(`/pacientes/${pacienteId}/historico`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      pacienteId,
      tipo: form.tipo,
      local: form.local,
      dataAtendimento: new Date(form.dataAtendimento).toISOString(),
    });
  };

  const breadcrumbs = [
    { label: "Pacientes", href: "/pacientes" },
    { label: paciente?.nome ?? "Paciente", href: `/pacientes/${pacienteId}/historico` },
    { label: "Novo Atendimento" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Novo Atendimento</h1>
          {paciente && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Paciente: <strong>{paciente.nome}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo de Atendimento</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as any })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="urgencia">Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="local">Local do Atendimento</Label>
              <Select
                value={form.local}
                onValueChange={(v) => setForm({ ...form, local: v as any })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ubs">UBS (Unidade Básica de Saúde)</SelectItem>
                  <SelectItem value="domicilio">Domicílio</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataAtendimento">Data e Hora do Atendimento</Label>
              <Input
                id="dataAtendimento"
                type="datetime-local"
                value={form.dataAtendimento}
                onChange={(e) => setForm({ ...form, dataAtendimento: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/pacientes/${pacienteId}/historico`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Iniciar Atendimento
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
