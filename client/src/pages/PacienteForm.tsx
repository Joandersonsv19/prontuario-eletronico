import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function PacienteForm() {
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id;
  const pacienteId = params.id ? parseInt(params.id) : undefined;
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  const { data: paciente, isLoading: loadingPaciente } = trpc.pacientes.get.useQuery(
    { id: pacienteId! },
    { enabled: isEditing }
  );

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    cns: "",
    dataNascimento: "",
    sexo: "" as "masculino" | "feminino" | "outro" | "",
    telefone: "",
    endereco: "",
    nomeMae: "",
  });

  useEffect(() => {
    if (paciente) {
      setForm({
        nome: paciente.nome ?? "",
        cpf: paciente.cpf ?? "",
        cns: paciente.cns ?? "",
        dataNascimento: paciente.dataNascimento
          ? format(new Date(paciente.dataNascimento), "yyyy-MM-dd")
          : "",
        sexo: (paciente.sexo as any) ?? "",
        telefone: paciente.telefone ?? "",
        endereco: paciente.endereco ?? "",
        nomeMae: paciente.nomeMae ?? "",
      });
    }
  }, [paciente]);

  const createMutation = trpc.pacientes.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      utils.pacientes.list.invalidate();
      navigate("/pacientes");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.pacientes.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso!");
      utils.pacientes.list.invalidate();
      utils.pacientes.get.invalidate({ id: pacienteId! });
      navigate(`/pacientes/${pacienteId}/historico`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    const payload = {
      nome: form.nome,
      cpf: form.cpf || undefined,
      cns: form.cns || undefined,
      dataNascimento: form.dataNascimento || undefined,
      sexo: (form.sexo || undefined) as "masculino" | "feminino" | "outro" | undefined,
      telefone: form.telefone || undefined,
      endereco: form.endereco || undefined,
      nomeMae: form.nomeMae || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: pacienteId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const breadcrumbs = [
    { label: "Pacientes", href: "/pacientes" },
    { label: isEditing ? "Editar Paciente" : "Novo Paciente" },
  ];

  if (isEditing && loadingPaciente) {
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Paciente" : "Novo Paciente"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Atualize os dados do paciente" : "Preencha os dados para cadastrar um novo paciente"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados pessoais */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo do paciente"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cns">CNS (Cartão Nacional de Saúde)</Label>
                <Input
                  id="cns"
                  value={form.cns}
                  onChange={(e) => setForm({ ...form, cns: e.target.value })}
                  placeholder="000 0000 0000 0000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sexo">Sexo</Label>
                <Select
                  value={form.sexo}
                  onValueChange={(v) => setForm({ ...form, sexo: v as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Contato e Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nomeMae">Nome da Mãe</Label>
                <Input
                  id="nomeMae"
                  value={form.nomeMae}
                  onChange={(e) => setForm({ ...form, nomeMae: e.target.value })}
                  placeholder="Nome completo da mãe"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/pacientes/${pacienteId}/historico` : "/pacientes")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? "Salvar Alterações" : "Cadastrar Paciente"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
