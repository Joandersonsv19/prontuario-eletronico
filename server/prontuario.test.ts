import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all db functions
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  listPacientes: vi.fn().mockResolvedValue([]),
  getPacienteById: vi.fn(),
  createPaciente: vi.fn().mockResolvedValue({}),
  updatePaciente: vi.fn().mockResolvedValue({}),
  deletePaciente: vi.fn().mockResolvedValue({}),
  listAtendimentos: vi.fn().mockResolvedValue([]),
  getAtendimentoById: vi.fn(),
  createAtendimento: vi.fn().mockResolvedValue({}),
  deleteAtendimento: vi.fn().mockResolvedValue({}),
  updateAtendimentoObservacoes: vi.fn().mockResolvedValue({}),
  getProntuarioByAtendimento: vi.fn(),
  upsertProntuario: vi.fn().mockResolvedValue(1),
  listDiagnosticos: vi.fn().mockResolvedValue([]),
  addDiagnostico: vi.fn().mockResolvedValue({}),
  deleteDiagnostico: vi.fn().mockResolvedValue({}),
  deleteAllDiagnosticos: vi.fn().mockResolvedValue({}),
  getSinaisVitais: vi.fn(),
  upsertSinaisVitais: vi.fn().mockResolvedValue({}),
  listPrescricoes: vi.fn().mockResolvedValue([]),
  addPrescricao: vi.fn().mockResolvedValue({}),
  deletePrescricao: vi.fn().mockResolvedValue({}),
  searchCiap2: vi.fn().mockResolvedValue([
    { codigo: "K86", descricao: "Hipertensão sem complicações" },
    { codigo: "T90", descricao: "Diabetes não insulino-dependente" },
  ]),
}));

import * as db from "./db";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("pacientes router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("lista pacientes do usuário autenticado", async () => {
    vi.mocked(db.listPacientes).mockResolvedValueOnce([
      {
        id: 1,
        usuarioId: 1,
        nome: "João Silva",
        cpf: "123.456.789-00",
        cns: null,
        dataNascimento: new Date("1990-01-01"),
        sexo: "masculino",
        telefone: null,
        endereco: null,
        nomeMae: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await caller.pacientes.list({});
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("João Silva");
    expect(db.listPacientes).toHaveBeenCalledWith(1, undefined);
  });

  it("lista pacientes com busca", async () => {
    await caller.pacientes.list({ busca: "João" });
    expect(db.listPacientes).toHaveBeenCalledWith(1, "João");
  });

  it("cria paciente com dados válidos", async () => {
    const result = await caller.pacientes.create({
      nome: "Maria Souza",
      cpf: "987.654.321-00",
      dataNascimento: "1985-06-15",
      sexo: "feminino",
    });
    expect(result.success).toBe(true);
    expect(db.createPaciente).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Maria Souza",
        cpf: "987.654.321-00",
        usuarioId: 1,
      })
    );
  });

  it("retorna erro ao buscar paciente de outro usuário", async () => {
    vi.mocked(db.getPacienteById).mockResolvedValueOnce(undefined);
    await expect(caller.pacientes.get({ id: 999 })).rejects.toThrow("Paciente não encontrado");
  });

  it("deleta paciente do usuário autenticado", async () => {
    const result = await caller.pacientes.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(db.deletePaciente).toHaveBeenCalledWith(1, 1);
  });
});

describe("atendimentos router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("cria atendimento vinculado ao paciente do usuário", async () => {
    vi.mocked(db.getPacienteById).mockResolvedValueOnce({
      id: 1,
      usuarioId: 1,
      nome: "João",
      cpf: null,
      cns: null,
      dataNascimento: null,
      sexo: null,
      telefone: null,
      endereco: null,
      nomeMae: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await caller.atendimentos.create({
      pacienteId: 1,
      tipo: "consulta",
      local: "ubs",
    });
    expect(result.success).toBe(true);
    expect(db.createAtendimento).toHaveBeenCalledWith(
      expect.objectContaining({ pacienteId: 1, usuarioId: 1, tipo: "consulta" })
    );
  });

  it("impede criar atendimento para paciente de outro usuário", async () => {
    vi.mocked(db.getPacienteById).mockResolvedValueOnce(undefined);
    await expect(
      caller.atendimentos.create({ pacienteId: 999, tipo: "consulta", local: "ubs" })
    ).rejects.toThrow("Acesso negado");
  });

  it("atualiza observações do atendimento", async () => {
    vi.mocked(db.getAtendimentoById).mockResolvedValueOnce({
      id: 1, pacienteId: 1, usuarioId: 1, tipo: "consulta", local: "ubs",
      dataAtendimento: new Date(), createdAt: new Date(), updatedAt: new Date(),
      observacoes: null,
    });
    const result = await caller.atendimentos.updateObservacoes({
      id: 1,
      observacoes: "Retorno em 30 dias. Encaminhado para cardiologista.",
    });
    expect(result.success).toBe(true);
    expect(db.updateAtendimentoObservacoes).toHaveBeenCalledWith(
      1, 1, "Retorno em 30 dias. Encaminhado para cardiologista."
    );
  });
});

describe("ciap2 router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("busca diagnósticos CIAP-2 por termo", async () => {
    const result = await caller.ciap2.search({ termo: "hipertensão" });
    expect(result).toHaveLength(2);
    expect(result[0].codigo).toBe("K86");
    expect(db.searchCiap2).toHaveBeenCalledWith("hipertensão", 10);
  });

  it("busca com limite personalizado", async () => {
    await caller.ciap2.search({ termo: "diabetes", limit: 5 });
    expect(db.searchCiap2).toHaveBeenCalledWith("diabetes", 5);
  });
});

describe("prontuarios router", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("salva prontuário SOAP com sinais vitais e diagnósticos", async () => {
    vi.mocked(db.getAtendimentoById).mockResolvedValueOnce({
      id: 1,
      pacienteId: 1,
      usuarioId: 1,
      tipo: "consulta",
      local: "ubs",
      dataAtendimento: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await caller.prontuarios.save({
      atendimentoId: 1,
      subjetivo: "Paciente refere cefaleia há 3 dias",
      objetivo: "PA: 140/90 mmHg",
      avaliacao: "Hipertensão arterial",
      plano: "Iniciar anti-hipertensivo",
      sinaisVitais: {
        pressaoArterial: "140/90",
        frequenciaCardiaca: 80,
        temperatura: "36.5",
        saturacao: 98,
      },
      diagnosticos: [
        { ciapCodigo: "K86", descricao: "Hipertensão sem complicações" },
      ],
    });

    expect(result.success).toBe(true);
    expect(db.upsertProntuario).toHaveBeenCalledWith(
      expect.objectContaining({
        atendimentoId: 1,
        subjetivo: "Paciente refere cefaleia há 3 dias",
      })
    );
    expect(db.upsertSinaisVitais).toHaveBeenCalled();
    expect(db.deleteAllDiagnosticos).toHaveBeenCalled();
    expect(db.addDiagnostico).toHaveBeenCalledWith(
      expect.objectContaining({ ciapCodigo: "K86" })
    );
  });

  it("impede salvar prontuário de atendimento de outro usuário", async () => {
    vi.mocked(db.getAtendimentoById).mockResolvedValueOnce(undefined);
    await expect(
      caller.prontuarios.save({ atendimentoId: 999, subjetivo: "teste" })
    ).rejects.toThrow("Acesso negado");
  });
});

describe("auth router", () => {
  it("retorna usuário autenticado", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.name).toBe("Test User");
    expect(user?.id).toBe(1);
  });

  it("realiza logout e limpa cookie", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      ...createAuthContext(),
      res: {
        clearCookie: (name: string, options: any) => clearedCookies.push({ name, options }),
      } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0].options.maxAge).toBe(-1);
  });
});
