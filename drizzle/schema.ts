import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
  index,
} from "drizzle-orm/mysql-core";

// ─── Usuários ────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Supervisão Acadêmica ─────────────────────────────────────────────────────

/**
 * Armazena os códigos de convite gerados por professores.
 * Um professor pode ter múltiplos códigos ativos.
 */
export const codigosConvite = mysqlTable("codigos_convite", {
  id: int("id").autoincrement().primaryKey(),
  professorId: int("professor_id").notNull(),
  codigo: varchar("codigo", { length: 12 }).notNull().unique(),
  ativo: int("ativo").default(1).notNull(), // 1=ativo, 0=revogado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodigoConvite = typeof codigosConvite.$inferSelect;

/**
 * Registra as conexões ativas entre alunos e professores.
 * Um aluno só pode estar conectado a um professor por vez.
 */
export const conexoesSupervisao = mysqlTable("conexoes_supervisao", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("aluno_id").notNull().unique(), // único: aluno só conecta a 1 professor
  professorId: int("professor_id").notNull(),
  codigoUsado: varchar("codigo_usado", { length: 12 }),
  ativa: int("ativa").default(1).notNull(), // 1=ativa, 0=encerrada
  iniciadaEm: timestamp("iniciada_em").defaultNow().notNull(),
  encerradaEm: timestamp("encerrada_em"),
});

export type ConexaoSupervisao = typeof conexoesSupervisao.$inferSelect;

/**
 * Histórico de todas as sessões de supervisão (para rastreabilidade).
 */
export const sessoesSupervisao = mysqlTable("sessoes_supervisao", {
  id: int("id").autoincrement().primaryKey(),
  alunoId: int("aluno_id").notNull(),
  professorId: int("professor_id").notNull(),
  iniciadaEm: timestamp("iniciada_em").defaultNow().notNull(),
  encerradaEm: timestamp("encerrada_em"),
  duracaoSegundos: int("duracao_segundos"),
});

export type SessaoSupervisao = typeof sessoesSupervisao.$inferSelect;

// ─── Tabela CIAP-2 ───────────────────────────────────────────────────────────
export const ciap2 = mysqlTable("ciap2", {
  codigo: varchar("codigo", { length: 10 }).primaryKey(),
  descricao: text("descricao").notNull(),
});

export type Ciap2 = typeof ciap2.$inferSelect;

// ─── Pacientes ───────────────────────────────────────────────────────────────
export const pacientes = mysqlTable(
  "pacientes",
  {
    id: int("id").autoincrement().primaryKey(),
    usuarioId: int("usuario_id").notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    cpf: varchar("cpf", { length: 14 }),
    cns: varchar("cns", { length: 20 }),
    dataNascimento: date("data_nascimento"),
    sexo: mysqlEnum("sexo", ["masculino", "feminino", "outro"]),
    telefone: varchar("telefone", { length: 20 }),
    endereco: text("endereco"),
    nomeMae: varchar("nome_mae", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("idx_paciente_usuario").on(t.usuarioId)]
);

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

// ─── Atendimentos ────────────────────────────────────────────────────────────
export const atendimentos = mysqlTable(
  "atendimentos",
  {
    id: int("id").autoincrement().primaryKey(),
    pacienteId: int("paciente_id").notNull(),
    usuarioId: int("usuario_id").notNull(),
    dataAtendimento: timestamp("data_atendimento").defaultNow().notNull(),
    tipo: mysqlEnum("tipo", [
      "consulta",
      "visita_domiciliar",
      "procedimento",
      "retorno",
      "urgencia",
    ]).default("consulta"),
    local: mysqlEnum("local", ["ubs", "domicilio", "outro"]).default("ubs"),
    observacoes: text("observacoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("idx_atendimento_paciente").on(t.pacienteId)]
);

export type Atendimento = typeof atendimentos.$inferSelect;
export type InsertAtendimento = typeof atendimentos.$inferInsert;

// ─── Prontuários (SOAP) ──────────────────────────────────────────────────────
export const prontuarios = mysqlTable("prontuarios", {
  id: int("id").autoincrement().primaryKey(),
  atendimentoId: int("atendimento_id").notNull().unique(),
  subjetivo: text("subjetivo"),
  objetivo: text("objetivo"),
  avaliacao: text("avaliacao"),
  plano: text("plano"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prontuario = typeof prontuarios.$inferSelect;
export type InsertProntuario = typeof prontuarios.$inferInsert;

// ─── Diagnósticos (CIAP-2) ───────────────────────────────────────────────────
export const diagnosticos = mysqlTable("diagnosticos", {
  id: int("id").autoincrement().primaryKey(),
  prontuarioId: int("prontuario_id").notNull(),
  ciapCodigo: varchar("ciap_codigo", { length: 10 }).notNull(),
  descricao: varchar("descricao", { length: 500 }).notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Diagnostico = typeof diagnosticos.$inferSelect;
export type InsertDiagnostico = typeof diagnosticos.$inferInsert;

// ─── Sinais Vitais ───────────────────────────────────────────────────────────
export const sinaisVitais = mysqlTable("sinais_vitais", {
  id: int("id").autoincrement().primaryKey(),
  prontuarioId: int("prontuario_id").notNull().unique(),
  pressaoArterial: varchar("pressao_arterial", { length: 20 }),
  frequenciaCardiaca: varchar("frequencia_cardiaca", { length: 10 }),
  temperatura: varchar("temperatura", { length: 10 }),
  saturacao: varchar("saturacao", { length: 10 }),
  glicemia: varchar("glicemia", { length: 20 }),
  peso: varchar("peso", { length: 10 }),
  altura: varchar("altura", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SinaisVitais = typeof sinaisVitais.$inferSelect;
export type InsertSinaisVitais = typeof sinaisVitais.$inferInsert;

// ─── Prescrições ─────────────────────────────────────────────────────────────
export const prescricoes = mysqlTable("prescricoes", {
  id: int("id").autoincrement().primaryKey(),
  prontuarioId: int("prontuario_id").notNull(),
  medicamento: varchar("medicamento", { length: 255 }).notNull(),
  dosagem: varchar("dosagem", { length: 100 }),
  frequencia: varchar("frequencia", { length: 100 }),
  duracao: varchar("duracao", { length: 100 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prescricao = typeof prescricoes.$inferSelect;
export type InsertPrescricao = typeof prescricoes.$inferInsert;
