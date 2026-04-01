import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getAtendimentoById,
  getPacienteById,
  getProntuarioByAtendimento,
  getSinaisVitais,
  listDiagnosticos,
  listPrescricoes,
} from "./db";
import { gerarProntuarioPDF } from "./pdfProntuario";

async function getUserFromRequest(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function registerPdfRoutes(app: Express) {
  app.get("/api/prontuario/:atendimentoId/pdf", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const atendimentoId = parseInt(req.params.atendimentoId);
      if (isNaN(atendimentoId)) {
        res.status(400).json({ error: "ID inválido" });
        return;
      }

      // Verificar que o atendimento pertence ao usuário
      const atendimento = await getAtendimentoById(atendimentoId, user.id);
      if (!atendimento) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }

      // Buscar paciente
      const paciente = await getPacienteById(atendimento.pacienteId, user.id);
      if (!paciente) {
        res.status(404).json({ error: "Paciente não encontrado" });
        return;
      }

      // Buscar prontuário e dados relacionados
      const prontuario = await getProntuarioByAtendimento(atendimentoId);
      let sinaisVitais = null;
      let diagnosticos: any[] = [];
      let prescricoes: any[] = [];

      if (prontuario) {
        [sinaisVitais, diagnosticos, prescricoes] = await Promise.all([
          getSinaisVitais(prontuario.id),
          listDiagnosticos(prontuario.id),
          listPrescricoes(prontuario.id),
        ]);
      }

      const pdfBuffer = await gerarProntuarioPDF({
        paciente,
        atendimento,
        profissional: user.name ?? "Profissional de Saúde",
        prontuario: prontuario ?? null,
        sinaisVitais: sinaisVitais ?? null,
        diagnosticos,
        prescricoes,
      });

      const nomeArquivo = `prontuario_${paciente.nome.replace(/\s+/g, "_")}_${atendimentoId}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[PDF] Erro ao gerar PDF:", err);
      res.status(500).json({ error: "Erro ao gerar PDF" });
    }
  });
}
