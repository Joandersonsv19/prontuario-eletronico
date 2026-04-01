import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addDiagnostico,
  addPrescricao,
  createAtendimento,
  createPaciente,
  deleteAtendimento,
  deleteDiagnostico,
  deletePaciente,
  getAtendimentoById,
  getPacienteById,
  updateAtendimentoObservacoes,
  getProntuarioByAtendimento,
  getSinaisVitais,
  listAtendimentos,
  listDiagnosticos,
  listPacientes,
  listPrescricoes,
  searchCiap2,
  updatePaciente,
  upsertProntuario,
  upsertSinaisVitais,
  deleteAllDiagnosticos,
  deletePrescricao,
  gerarCodigoConvite,
  getCodigoConvite,
  revogarCodigoConvite,
  getCodigosAtivos,
  getConexaoAtiva,
  criarConexao,
  encerrarConexao,
  listSessoesSupervisao,
} from "./db";

// ─── Pacientes Router ─────────────────────────────────────────────────────────
const pacientesRouter = router({
  list: protectedProcedure
    .input(z.object({ busca: z.string().optional() }))
    .query(({ ctx, input }) => listPacientes(ctx.user.id, input.busca)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const p = await getPacienteById(input.id, ctx.user.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      return p;
    }),

  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(2),
        cpf: z.string().optional(),
        cns: z.string().optional(),
        dataNascimento: z.string().optional(),
        sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        nomeMae: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createPaciente({
        usuarioId: ctx.user.id,
        nome: input.nome,
        cpf: input.cpf ?? null,
        cns: input.cns ?? null,
        dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
        sexo: input.sexo ?? null,
        telefone: input.telefone ?? null,
        endereco: input.endereco ?? null,
        nomeMae: input.nomeMae ?? null,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        cpf: z.string().optional(),
        cns: z.string().optional(),
        dataNascimento: z.string().optional(),
        sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        nomeMae: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dataNascimento, ...rest } = input;
      await updatePaciente(id, ctx.user.id, {
        ...rest,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePaciente(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Atendimentos Router ──────────────────────────────────────────────────────
const atendimentosRouter = router({
  list: protectedProcedure
    .input(z.object({ pacienteId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify patient belongs to user
      const p = await getPacienteById(input.pacienteId, ctx.user.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      return listAtendimentos(input.pacienteId, ctx.user.id);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const a = await getAtendimentoById(input.id, ctx.user.id);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Atendimento não encontrado" });
      return a;
    }),

  create: protectedProcedure
    .input(
      z.object({
        pacienteId: z.number(),
        tipo: z.enum(["consulta", "visita_domiciliar", "procedimento", "retorno", "urgencia"]).optional(),
        local: z.enum(["ubs", "domicilio", "outro"]).optional(),
        dataAtendimento: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const p = await getPacienteById(input.pacienteId, ctx.user.id);
      if (!p) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      await createAtendimento({
        pacienteId: input.pacienteId,
        usuarioId: ctx.user.id,
        tipo: input.tipo ?? "consulta",
        local: input.local ?? "ubs",
        dataAtendimento: input.dataAtendimento ? new Date(input.dataAtendimento) : new Date(),
        observacoes: input.observacoes ?? null,
      });
      return { success: true };
    }),

  updateObservacoes: protectedProcedure
    .input(z.object({ id: z.number(), observacoes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const a = await getAtendimentoById(input.id, ctx.user.id);
      if (!a) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      await updateAtendimentoObservacoes(input.id, ctx.user.id, input.observacoes);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAtendimento(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Prontuários Router ───────────────────────────────────────────────────────
const prontuariosRouter = router({
  getByAtendimento: protectedProcedure
    .input(z.object({ atendimentoId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify atendimento belongs to user
      const a = await getAtendimentoById(input.atendimentoId, ctx.user.id);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Atendimento não encontrado" });
      const prontuario = await getProntuarioByAtendimento(input.atendimentoId);
      if (!prontuario) return null;

      const [diags, sinais, prescricoesList] = await Promise.all([
        listDiagnosticos(prontuario.id),
        getSinaisVitais(prontuario.id),
        listPrescricoes(prontuario.id),
      ]);

      return { ...prontuario, diagnosticos: diags, sinaisVitais: sinais, prescricoes: prescricoesList };
    }),

  save: protectedProcedure
    .input(
      z.object({
        atendimentoId: z.number(),
        subjetivo: z.string().optional(),
        objetivo: z.string().optional(),
        avaliacao: z.string().optional(),
        plano: z.string().optional(),
        sinaisVitais: z
          .object({
            pressaoArterial: z.string().optional(),
            frequenciaCardiaca: z.union([z.string(), z.number()]).optional(),
            temperatura: z.union([z.string(), z.number()]).optional(),
            saturacao: z.union([z.string(), z.number()]).optional(),
            glicemia: z.union([z.string(), z.number()]).optional(),
            peso: z.union([z.string(), z.number()]).optional(),
            altura: z.union([z.string(), z.number()]).optional(),
          })
          .optional(),
        diagnosticos: z
          .array(
            z.object({
              ciapCodigo: z.string(),
              descricao: z.string(),
              observacao: z.string().optional(),
            })
          )
          .optional(),
        prescricoes: z
          .array(
            z.object({
              medicamento: z.string(),
              dosagem: z.string().optional(),
              frequencia: z.string().optional(),
              duracao: z.string().optional(),
              observacoes: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify atendimento belongs to user
      const a = await getAtendimentoById(input.atendimentoId, ctx.user.id);
      if (!a) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });

      const prontuarioId = await upsertProntuario({
        atendimentoId: input.atendimentoId,
        subjetivo: input.subjetivo ?? null,
        objetivo: input.objetivo ?? null,
        avaliacao: input.avaliacao ?? null,
        plano: input.plano ?? null,
      });

      // Save sinais vitais
      if (input.sinaisVitais) {
        const sv = input.sinaisVitais;
        const toStr = (v: string | number | undefined | null) =>
          v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : null;
        await upsertSinaisVitais({
          prontuarioId,
          pressaoArterial: toStr(sv.pressaoArterial),
          frequenciaCardiaca: toStr(sv.frequenciaCardiaca),
          temperatura: toStr(sv.temperatura),
          saturacao: toStr(sv.saturacao),
          glicemia: toStr(sv.glicemia),
          peso: toStr(sv.peso),
          altura: toStr(sv.altura),
        });
      }

      // Replace diagnosticos
      if (input.diagnosticos !== undefined) {
        await deleteAllDiagnosticos(prontuarioId);
        for (const d of input.diagnosticos) {
          await addDiagnostico({
            prontuarioId,
            ciapCodigo: d.ciapCodigo,
            descricao: d.descricao,
            observacao: d.observacao ?? null,
          });
        }
      }

      // Add new prescricoes
      if (input.prescricoes !== undefined) {
        for (const p of input.prescricoes) {
          await addPrescricao({
            prontuarioId,
            medicamento: p.medicamento,
            dosagem: p.dosagem ?? null,
            frequencia: p.frequencia ?? null,
            duracao: p.duracao ?? null,
            observacoes: p.observacoes ?? null,
          });
        }
      }

      return { success: true, prontuarioId };
    }),

  deletePrescricao: protectedProcedure
    .input(z.object({ id: z.number(), atendimentoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const a = await getAtendimentoById(input.atendimentoId, ctx.user.id);
      if (!a) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      await deletePrescricao(input.id);
      return { success: true };
    }),
});

// ─── CIAP-2 Router ────────────────────────────────────────────────────────────
const ciap2Router = router({
  search: protectedProcedure
    .input(z.object({ termo: z.string().min(1), limit: z.number().optional() }))
    .query(({ input }) => searchCiap2(input.termo, input.limit ?? 10)),
});

// ─── Supervisão Acadêmica Router ─────────────────────────────────────────────
const supervisaoRouter = router({
  // Professor: gerar código de convite
  gerarCodigo: protectedProcedure.mutation(async ({ ctx }) => {
    const codigo = await gerarCodigoConvite(ctx.user.id);
    return { codigo };
  }),

  // Professor: listar códigos ativos
  listarCodigos: protectedProcedure.query(async ({ ctx }) => {
    return getCodigosAtivos(ctx.user.id);
  }),

  // Professor: revogar código
  revogarCodigo: protectedProcedure
    .input(z.object({ codigo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await revogarCodigoConvite(input.codigo, ctx.user.id);
      return { success: true };
    }),

  // Professor: histórico de sessões
  historicoSessoes: protectedProcedure.query(async ({ ctx }) => {
    return listSessoesSupervisao(ctx.user.id);
  }),

  // Aluno: conectar ao professor via código
  conectar: protectedProcedure
    .input(z.object({ codigo: z.string().min(4).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const convite = await getCodigoConvite(input.codigo.toUpperCase());
      if (!convite) throw new TRPCError({ code: "NOT_FOUND", message: "Código inválido ou expirado" });
      if (convite.professorId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode conectar ao seu próprio código" });
      await criarConexao(ctx.user.id, convite.professorId, input.codigo.toUpperCase());
      return { success: true, professorId: convite.professorId };
    }),

  // Aluno: desconectar do professor
  desconectar: protectedProcedure.mutation(async ({ ctx }) => {
    await encerrarConexao(ctx.user.id);
    return { success: true };
  }),

  // Aluno: verificar conexão ativa
  minhaConexao: protectedProcedure.query(async ({ ctx }) => {
    return getConexaoAtiva(ctx.user.id);
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  pacientes: pacientesRouter,
  atendimentos: atendimentosRouter,
  prontuarios: prontuariosRouter,
  ciap2: ciap2Router,
  supervisao: supervisaoRouter,
});

export type AppRouter = typeof appRouter;
