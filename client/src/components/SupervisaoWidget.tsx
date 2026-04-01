import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GraduationCap, Wifi, WifiOff, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { getSocket } from "@/hooks/useSocket";

interface SupervisaoWidgetProps {
  /** Callback chamado quando a conexão muda (para atualizar o estado no pai) */
  onConexaoChange?: (professorId: number | null) => void;
}

export function SupervisaoWidget({ onConexaoChange }: SupervisaoWidgetProps) {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const utils = trpc.useUtils();

  const { data: conexao, isLoading } = trpc.supervisao.minhaConexao.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const conectarMutation = trpc.supervisao.conectar.useMutation({
    onSuccess: (data) => {
      toast.success("Conectado ao professor! O professor pode ver seu prontuário em tempo real.");
      setOpen(false);
      setCodigo("");
      utils.supervisao.minhaConexao.invalidate();
      onConexaoChange?.(data.professorId);
      // Entrar na sala Socket.io
      const socket = getSocket();
      if (!socket.connected) socket.connect();
      socket.emit("aluno:entrar_supervisao", { professorId: data.professorId });
    },
    onError: (e) => toast.error(e.message),
  });

  const desconectarMutation = trpc.supervisao.desconectar.useMutation({
    onSuccess: () => {
      toast.success("Desconectado do professor.");
      utils.supervisao.minhaConexao.invalidate();
      onConexaoChange?.(null);
      // Sair da sala Socket.io
      const socket = getSocket();
      socket.emit("aluno:sair_supervisao");
    },
    onError: (e) => toast.error(e.message),
  });

  const isConectado = conexao?.ativa === 1;

  if (isLoading) return null;

  return (
    <>
      {isConectado ? (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 pr-1"
          >
            <Eye className="w-3 h-3" />
            Supervisionado
            <button
              onClick={() => desconectarMutation.mutate()}
              disabled={desconectarMutation.isPending}
              className="ml-1 rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-100 transition-colors"
              title="Desconectar do professor"
            >
              {desconectarMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </button>
          </Badge>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-primary border-primary/30 hover:bg-primary/5"
          onClick={() => setOpen(true)}
        >
          <GraduationCap className="w-4 h-4" />
          Conectar ao Professor
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Conectar ao Professor
            </DialogTitle>
            <DialogDescription>
              Insira o código de convite fornecido pelo seu professor para iniciar a supervisão em
              tempo real do seu atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-primary" />
                Como funciona
              </p>
              <p>
                Após conectar, o professor poderá visualizar em tempo real o que você está
                preenchendo no prontuário. Você pode desconectar a qualquer momento.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Convite</label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ex: AB12CD34"
                maxLength={12}
                className="font-mono text-center text-lg tracking-widest"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && codigo.length >= 4) {
                    conectarMutation.mutate({ codigo });
                  }
                }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => conectarMutation.mutate({ codigo })}
                disabled={codigo.length < 4 || conectarMutation.isPending}
                className="gap-2"
              >
                {conectarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Conectar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
