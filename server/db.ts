import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  InsertUser,
  atendimentos,
  ciap2,
  codigosConvite,
  conexoesSupervisao,
  diagnosticos,
  pacientes,
  prescricoes,
  prontuarios,
  sessoesSupervisao,
  sinaisVitais,
  users,
  type InsertAtendimento,
  type InsertDiagnostico,
  type InsertPaciente,
  type InsertPrescricao,
  type InsertProntuario,
  type InsertSinaisVitais,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Usuários ────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Pacientes ───────────────────────────────────────────────────────────────

export async function listPacientes(usuarioId: number, busca?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(pacientes.usuarioId, usuarioId)];
  if (busca && busca.trim()) {
    conditions.push(
      or(
        like(pacientes.nome, `%${busca}%`),
        like(pacientes.cpf, `%${busca}%`),
        like(pacientes.cns, `%${busca}%`)
      )!
    );
  }

  return db
    .select()
    .from(pacientes)
    .where(and(...conditions))
    .orderBy(desc(pacientes.createdAt));
}

export async function getPacienteById(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(pacientes)
    .where(and(eq(pacientes.id, id), eq(pacientes.usuarioId, usuarioId)))
    .limit(1);
  return result[0];
}

export async function createPaciente(data: InsertPaciente) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(pacientes).values(data);
  return result[0];
}

export async function updatePaciente(
  id: number,
  usuarioId: number,
  data: Partial<InsertPaciente>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(pacientes)
    .set(data)
    .where(and(eq(pacientes.id, id), eq(pacientes.usuarioId, usuarioId)));
}

export async function deletePaciente(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(pacientes)
    .where(and(eq(pacientes.id, id), eq(pacientes.usuarioId, usuarioId)));
}

// ─── Atendimentos ────────────────────────────────────────────────────────────

export async function listAtendimentos(pacienteId: number, usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atendimentos)
    .where(
      and(eq(atendimentos.pacienteId, pacienteId), eq(atendimentos.usuarioId, usuarioId))
    )
    .orderBy(desc(atendimentos.dataAtendimento));
}

export async function getAtendimentoById(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(atendimentos)
    .where(and(eq(atendimentos.id, id), eq(atendimentos.usuarioId, usuarioId)))
    .limit(1);
  return result[0];
}

export async function createAtendimento(data: InsertAtendimento) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(atendimentos).values(data);
  return result[0];
}

export async function deleteAtendimento(id: number, usuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(atendimentos)
    .where(and(eq(atendimentos.id, id), eq(atendimentos.usuarioId, usuarioId)));
}

export async function updateAtendimentoObservacoes(
  id: number,
  usuarioId: number,
  observacoes: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(atendimentos)
    .set({ observacoes })
    .where(and(eq(atendimentos.id, id), eq(atendimentos.usuarioId, usuarioId)));
}

// ─── Prontuários ─────────────────────────────────────────────────────────────

export async function getProntuarioByAtendimento(atendimentoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(prontuarios)
    .where(eq(prontuarios.atendimentoId, atendimentoId))
    .limit(1);
  return result[0];
}

export async function upsertProntuario(data: InsertProntuario) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getProntuarioByAtendimento(data.atendimentoId);
  if (existing) {
    await db
      .update(prontuarios)
      .set({ subjetivo: data.subjetivo, objetivo: data.objetivo, avaliacao: data.avaliacao, plano: data.plano })
      .where(eq(prontuarios.atendimentoId, data.atendimentoId));
    return existing.id;
  } else {
    const result = await db.insert(prontuarios).values(data);
    return (result[0] as any).insertId as number;
  }
}

// ─── Diagnósticos ────────────────────────────────────────────────────────────

export async function listDiagnosticos(prontuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(diagnosticos)
    .where(eq(diagnosticos.prontuarioId, prontuarioId))
    .orderBy(diagnosticos.createdAt);
}

export async function addDiagnostico(data: InsertDiagnostico) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(diagnosticos).values(data);
}

export async function deleteDiagnostico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(diagnosticos).where(eq(diagnosticos.id, id));
}

export async function deleteAllDiagnosticos(prontuarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(diagnosticos).where(eq(diagnosticos.prontuarioId, prontuarioId));
}

// ─── Sinais Vitais ───────────────────────────────────────────────────────────

export async function getSinaisVitais(prontuarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sinaisVitais)
    .where(eq(sinaisVitais.prontuarioId, prontuarioId))
    .limit(1);
  return result[0];
}

export async function upsertSinaisVitais(data: InsertSinaisVitais) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getSinaisVitais(data.prontuarioId);
  if (existing) {
    await db
      .update(sinaisVitais)
      .set({
        pressaoArterial: data.pressaoArterial,
        frequenciaCardiaca: data.frequenciaCardiaca,
        temperatura: data.temperatura,
        saturacao: data.saturacao,
        glicemia: data.glicemia,
        peso: data.peso,
        altura: data.altura,
      })
      .where(eq(sinaisVitais.prontuarioId, data.prontuarioId));
  } else {
    await db.insert(sinaisVitais).values(data);
  }
}

// ─── Prescrições ─────────────────────────────────────────────────────────────

export async function listPrescricoes(prontuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(prescricoes)
    .where(eq(prescricoes.prontuarioId, prontuarioId))
    .orderBy(prescricoes.createdAt);
}

export async function addPrescricao(data: InsertPrescricao) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(prescricoes).values(data);
}

export async function deletePrescricao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(prescricoes).where(eq(prescricoes.id, id));
}

export { deletePrescricao as removePrescricao };

// ─── CIAP-2 ──────────────────────────────────────────────────────────────────

export async function searchCiap2(termo: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ciap2)
    .where(
      or(
        like(ciap2.descricao, `%${termo}%`),
        like(ciap2.codigo, `%${termo}%`)
      )
    )
    .limit(limit);
}

// ─── Supervisão Acadêmica ─────────────────────────────────────────────

export async function gerarCodigoConvite(professorId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Gerar código alfanumérico de 8 caracteres maiúsculos
  const codigo = nanoid(8).toUpperCase();
  await db.insert(codigosConvite).values({ professorId, codigo });
  return codigo;
}

export async function getCodigoConvite(codigo: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(codigosConvite)
    .where(and(eq(codigosConvite.codigo, codigo), eq(codigosConvite.ativo, 1)))
    .limit(1);
  return result[0];
}

export async function revogarCodigoConvite(codigo: string, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(codigosConvite)
    .set({ ativo: 0 })
    .where(and(eq(codigosConvite.codigo, codigo), eq(codigosConvite.professorId, professorId)));
}

export async function getCodigosAtivos(professorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(codigosConvite)
    .where(and(eq(codigosConvite.professorId, professorId), eq(codigosConvite.ativo, 1)))
    .orderBy(desc(codigosConvite.createdAt));
}

export async function getConexaoAtiva(alunoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(conexoesSupervisao)
    .where(and(eq(conexoesSupervisao.alunoId, alunoId), eq(conexoesSupervisao.ativa, 1)))
    .limit(1);
  return result[0];
}

export async function criarConexao(alunoId: number, professorId: number, codigoUsado: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Encerrar conexão anterior se existir
  await db
    .update(conexoesSupervisao)
    .set({ ativa: 0, encerradaEm: new Date() })
    .where(eq(conexoesSupervisao.alunoId, alunoId));
  // Criar nova conexão
  await db.insert(conexoesSupervisao).values({ alunoId, professorId, codigoUsado });
  // Registrar sessão para rastreabilidade
  await db.insert(sessoesSupervisao).values({ alunoId, professorId });
}

export async function encerrarConexao(alunoId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const agora = new Date();
  // Buscar sessão ativa para calcular duração
  const conexao = await getConexaoAtiva(alunoId);
  if (!conexao) return;
  const duracaoMs = agora.getTime() - conexao.iniciadaEm.getTime();
  const duracaoSegundos = Math.floor(duracaoMs / 1000);
  // Encerrar conexão
  await db
    .update(conexoesSupervisao)
    .set({ ativa: 0, encerradaEm: agora })
    .where(eq(conexoesSupervisao.alunoId, alunoId));
  // Atualizar sessão de rastreabilidade
  await db
    .update(sessoesSupervisao)
    .set({ encerradaEm: agora, duracaoSegundos })
    .where(
      and(
        eq(sessoesSupervisao.alunoId, alunoId),
        eq(sessoesSupervisao.professorId, conexao.professorId)
      )
    );
}

export async function listSessoesSupervisao(professorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: sessoesSupervisao.id,
      alunoId: sessoesSupervisao.alunoId,
      alunoNome: users.name,
      iniciadaEm: sessoesSupervisao.iniciadaEm,
      encerradaEm: sessoesSupervisao.encerradaEm,
      duracaoSegundos: sessoesSupervisao.duracaoSegundos,
    })
    .from(sessoesSupervisao)
    .leftJoin(users, eq(sessoesSupervisao.alunoId, users.id))
    .where(eq(sessoesSupervisao.professorId, professorId))
    .orderBy(desc(sessoesSupervisao.iniciadaEm))
    .limit(100);
}
