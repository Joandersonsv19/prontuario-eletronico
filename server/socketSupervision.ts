import type { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { sdk } from "./_core/sdk";
import { getConexaoAtiva } from "./db";

// ─── Tipos dos eventos ────────────────────────────────────────────────────────
export interface ProntuarioUpdate {
  atendimentoId: number;
  soap: {
    subjetivo: string;
    objetivo: string;
    avaliacao: string;
    plano: string;
  };
  sinaisVitais: {
    pressaoArterial: string;
    frequenciaCardiaca: string;
    temperatura: string;
    saturacao: string;
    glicemia: string;
    peso: string;
    altura: string;
  };
  diagnosticos: Array<{ ciapCodigo: string; descricao: string }>;
  prescricoes: Array<{ medicamento: string; dosagem: string; frequencia: string; duracao: string }>;
  observacoes: string;
  pacienteNome: string;
  timestamp: number;
}

export interface AlunoInfo {
  alunoId: number;
  alunoNome: string;
  socketId: string;
  conectadoEm: number;
  ultimaAtualizacao?: number;
  prontuarioAtual?: ProntuarioUpdate;
}

// ─── Estado em memória ────────────────────────────────────────────────────────
// Map: professorId -> Map<alunoId, AlunoInfo>
const professorAlunos = new Map<number, Map<number, AlunoInfo>>();
// Map: socketId -> { userId, role }
const socketUsers = new Map<string, { userId: number; role: string; name: string }>();
// Map: alunoId -> professorId (conexão ativa em memória)
const alunoConectado = new Map<number, number>();

let io: SocketServer | null = null;

export function getIO(): SocketServer | null {
  return io;
}

export function setupSocketIO(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.use(async (socket: Socket, next) => {
    try {
      // Autenticar via cookie de sessão
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const fakeReq = {
        headers: { cookie: cookieHeader },
        protocol: "https",
      } as any;
      const user = await sdk.authenticateRequest(fakeReq);
      if (!user) return next(new Error("Não autenticado"));
      socketUsers.set(socket.id, { userId: user.id, role: user.role, name: user.name ?? "Usuário" });
      next();
    } catch {
      next(new Error("Falha na autenticação"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userInfo = socketUsers.get(socket.id);
    if (!userInfo) { socket.disconnect(); return; }

    // ── Aluno: entrar na sala de supervisão ──────────────────────────────────
    socket.on("aluno:entrar_supervisao", async (data: { professorId: number }) => {
      const { professorId } = data;
      const alunoId = userInfo.userId;

      // Verificar se há conexão ativa no banco
      const conexao = await getConexaoAtiva(alunoId);
      if (!conexao || conexao.professorId !== professorId) return;

      // Registrar em memória
      alunoConectado.set(alunoId, professorId);
      if (!professorAlunos.has(professorId)) {
        professorAlunos.set(professorId, new Map());
      }
      const alunoInfo: AlunoInfo = {
        alunoId,
        alunoNome: userInfo.name,
        socketId: socket.id,
        conectadoEm: Date.now(),
      };
      professorAlunos.get(professorId)!.set(alunoId, alunoInfo);

      // Entrar na sala do professor
      socket.join(`professor:${professorId}`);

      // Notificar professor sobre novo aluno conectado
      socket.to(`professor:${professorId}`).emit("professor:aluno_conectado", alunoInfo);

      // Confirmar para o aluno
      socket.emit("aluno:supervisao_ativa", { professorId });
    });

    // ── Aluno: enviar atualização do prontuário ──────────────────────────────
    socket.on("aluno:prontuario_update", (update: ProntuarioUpdate) => {
      const alunoId = userInfo.userId;
      const professorId = alunoConectado.get(alunoId);
      if (!professorId) return;

      const alunos = professorAlunos.get(professorId);
      if (!alunos) return;

      const alunoInfo = alunos.get(alunoId);
      if (!alunoInfo) return;

      // Atualizar estado em memória
      alunoInfo.ultimaAtualizacao = Date.now();
      alunoInfo.prontuarioAtual = { ...update, timestamp: Date.now() };

      // Emitir para o professor (sala isolada)
      socket.to(`professor:${professorId}`).emit("professor:prontuario_update", {
        alunoId,
        alunoNome: alunoInfo.alunoNome,
        update: alunoInfo.prontuarioAtual,
      });
    });

    // ── Aluno: sair da supervisão ────────────────────────────────────────────
    socket.on("aluno:sair_supervisao", () => {
      const alunoId = userInfo.userId;
      const professorId = alunoConectado.get(alunoId);
      if (!professorId) return;

      _removerAluno(socket, alunoId, professorId);
    });

    // ── Professor: entrar na sala de supervisão ──────────────────────────────
    socket.on("professor:entrar_sala", () => {
      const professorId = userInfo.userId;
      socket.join(`professor:${professorId}`);

      // Enviar lista atual de alunos conectados
      const alunos = professorAlunos.get(professorId);
      const lista = alunos ? Array.from(alunos.values()) : [];
      socket.emit("professor:lista_alunos", lista);
    });

    // ── Professor: solicitar estado atual de um aluno ────────────────────────
    socket.on("professor:solicitar_estado", (data: { alunoId: number }) => {
      const professorId = userInfo.userId;
      const alunos = professorAlunos.get(professorId);
      if (!alunos) return;
      const alunoInfo = alunos.get(data.alunoId);
      if (alunoInfo?.prontuarioAtual) {
        socket.emit("professor:prontuario_update", {
          alunoId: data.alunoId,
          alunoNome: alunoInfo.alunoNome,
          update: alunoInfo.prontuarioAtual,
        });
      }
    });

    // ── Desconexão ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const alunoId = userInfo.userId;
      const professorId = alunoConectado.get(alunoId);
      if (professorId) {
        _removerAluno(socket, alunoId, professorId);
      }
      socketUsers.delete(socket.id);
    });
  });

  return io;
}

function _removerAluno(socket: Socket, alunoId: number, professorId: number) {
  alunoConectado.delete(alunoId);
  const alunos = professorAlunos.get(professorId);
  if (alunos) {
    alunos.delete(alunoId);
    if (alunos.size === 0) professorAlunos.delete(professorId);
  }
  socket.leave(`professor:${professorId}`);
  // Notificar professor
  if (io) {
    io.to(`professor:${professorId}`).emit("professor:aluno_desconectado", { alunoId });
  }
}

export function getAlunosConectados(professorId: number): AlunoInfo[] {
  const alunos = professorAlunos.get(professorId);
  return alunos ? Array.from(alunos.values()) : [];
}
