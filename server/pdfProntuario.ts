import PDFDocument from "pdfkit";

interface SinaisVitais {
  pressaoArterial?: string | null;
  frequenciaCardiaca?: string | null;
  temperatura?: string | null;
  saturacao?: string | null;
  glicemia?: string | null;
  peso?: string | null;
  altura?: string | null;
}

interface Diagnostico {
  ciapCodigo: string;
  descricao: string;
}

interface Prescricao {
  medicamento: string;
  dosagem?: string | null;
  frequencia?: string | null;
  duracao?: string | null;
  observacoes?: string | null;
}

interface ProntuarioPDFData {
  paciente: {
    nome: string;
    cpf?: string | null;
    cns?: string | null;
    dataNascimento?: Date | string | null;
    sexo?: string | null;
    telefone?: string | null;
  };
  atendimento: {
    dataAtendimento: Date | string;
    tipo?: string | null;
    local?: string | null;
    observacoes?: string | null;
  };
  profissional: string;
  prontuario?: {
    subjetivo?: string | null;
    objetivo?: string | null;
    avaliacao?: string | null;
    plano?: string | null;
  } | null;
  sinaisVitais?: SinaisVitais | null;
  diagnosticos?: Diagnostico[];
  prescricoes?: Prescricao[];
}

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

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR");
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString("pt-BR");
}

function calcIdade(dataNascimento: Date | string | null | undefined): string {
  if (!dataNascimento) return "";
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

export function gerarProntuarioPDF(data: ProntuarioPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PRIMARY = "#0f766e"; // teal-700
    const DARK = "#1e293b";
    const GRAY = "#64748b";
    const LIGHT_BG = "#f8fafc";
    const pageWidth = doc.page.width - 100; // margins

    // ── CABEÇALHO ──────────────────────────────────────────────────────────────
    doc.rect(50, 40, pageWidth, 60).fill(PRIMARY);
    doc
      .fillColor("white")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PRONTUÁRIO ELETRÔNICO", 60, 52, { width: pageWidth - 20 });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Atenção Básica em Saúde", 60, 75);
    doc.fillColor(DARK);

    let y = 120;

    // ── DADOS DO PACIENTE ──────────────────────────────────────────────────────
    doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
    doc
      .fillColor(DARK)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("DADOS DO PACIENTE", 55, y + 3);
    y += 22;

    const p = data.paciente;
    const idade = calcIdade(p.dataNascimento);

    const col1 = 55;
    const col2 = 310;

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text("Nome:", col1, y);
    doc.font("Helvetica").fillColor(DARK).text(p.nome, col1 + 35, y);

    if (p.sexo) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("Sexo:", col2, y);
      const sexoLabel = p.sexo === "masculino" ? "Masculino" : p.sexo === "feminino" ? "Feminino" : "Outro";
      doc.font("Helvetica").fillColor(DARK).text(sexoLabel, col2 + 30, y);
    }
    y += 14;

    if (p.dataNascimento) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("Nascimento:", col1, y);
      doc.font("Helvetica").fillColor(DARK).text(`${formatDate(p.dataNascimento)} (${idade})`, col1 + 65, y);
    }
    if (p.cpf) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("CPF:", col2, y);
      doc.font("Helvetica").fillColor(DARK).text(p.cpf, col2 + 25, y);
    }
    y += 14;

    if (p.cns) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("CNS:", col1, y);
      doc.font("Helvetica").fillColor(DARK).text(p.cns, col1 + 27, y);
    }
    if (p.telefone) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("Telefone:", col2, y);
      doc.font("Helvetica").fillColor(DARK).text(p.telefone, col2 + 50, y);
    }
    y += 20;

    // ── DADOS DO ATENDIMENTO ───────────────────────────────────────────────────
    doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("DADOS DO ATENDIMENTO", 55, y + 3);
    y += 22;

    const a = data.atendimento;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text("Data/Hora:", col1, y);
    doc.font("Helvetica").fillColor(DARK).text(formatDateTime(a.dataAtendimento), col1 + 55, y);
    doc.font("Helvetica-Bold").fillColor(GRAY).text("Tipo:", col2, y);
    doc.font("Helvetica").fillColor(DARK).text(tipoLabels[a.tipo ?? "consulta"] ?? a.tipo ?? "—", col2 + 28, y);
    y += 14;

    doc.font("Helvetica-Bold").fillColor(GRAY).text("Local:", col1, y);
    doc.font("Helvetica").fillColor(DARK).text(localLabels[a.local ?? "ubs"] ?? a.local ?? "—", col1 + 33, y);
    doc.font("Helvetica-Bold").fillColor(GRAY).text("Profissional:", col2, y);
    doc.font("Helvetica").fillColor(DARK).text(data.profissional, col2 + 65, y);
    y += 14;

    if (a.observacoes) {
      doc.font("Helvetica-Bold").fillColor(GRAY).text("Observações:", col1, y);
      doc.font("Helvetica").fillColor(DARK).text(a.observacoes, col1 + 70, y, { width: pageWidth - 70 });
      y += doc.heightOfString(a.observacoes, { width: pageWidth - 70 }) + 6;
    }
    y += 6;

    // ── SINAIS VITAIS ──────────────────────────────────────────────────────────
    const sv = data.sinaisVitais;
    const hasSinais = sv && Object.values(sv).some((v) => v !== null && v !== undefined && v !== "");
    if (hasSinais) {
      doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("SINAIS VITAIS", 55, y + 3);
      y += 22;

      const svItems = [
        { label: "Pressão Arterial", value: sv!.pressaoArterial },
        { label: "Freq. Cardíaca", value: sv!.frequenciaCardiaca ? `${sv!.frequenciaCardiaca} bpm` : null },
        { label: "Temperatura", value: sv!.temperatura ? `${sv!.temperatura} °C` : null },
        { label: "Saturação", value: sv!.saturacao ? `${sv!.saturacao}%` : null },
        { label: "Glicemia", value: sv!.glicemia },
        { label: "Peso", value: sv!.peso ? `${sv!.peso} kg` : null },
        { label: "Altura", value: sv!.altura ? `${sv!.altura} cm` : null },
      ].filter((i) => i.value);

      const colW = pageWidth / 4;
      let svX = col1;
      let svRow = 0;
      for (const item of svItems) {
        if (svRow > 0 && svRow % 4 === 0) {
          y += 28;
          svX = col1;
        }
        const cx = col1 + (svRow % 4) * colW;
        doc.rect(cx - 2, y - 2, colW - 8, 24).fill(LIGHT_BG).stroke("#e2e8f0");
        doc.fontSize(7).font("Helvetica-Bold").fillColor(GRAY).text(item.label, cx + 2, y + 1);
        doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK).text(item.value!, cx + 2, y + 10);
        svRow++;
      }
      y += 36;
    }

    // ── SOAP ──────────────────────────────────────────────────────────────────
    const pront = data.prontuario;
    if (pront && (pront.subjetivo || pront.objetivo || pront.avaliacao || pront.plano)) {
      doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("PRONTUÁRIO CLÍNICO (SOAP)", 55, y + 3);
      y += 22;

      const soapSections = [
        { letter: "S", label: "Subjetivo", color: "#3b82f6", text: pront.subjetivo },
        { letter: "O", label: "Objetivo", color: "#22c55e", text: pront.objetivo },
        { letter: "A", label: "Avaliação / Diagnóstico", color: "#f97316", text: pront.avaliacao },
        { letter: "P", label: "Plano", color: "#a855f7", text: pront.plano },
      ];

      for (const sec of soapSections) {
        if (!sec.text) continue;
        if (y > doc.page.height - 120) {
          doc.addPage();
          y = 50;
        }
        // Letter badge
        doc.rect(50, y, 20, 20).fill(sec.color);
        doc.fillColor("white").fontSize(11).font("Helvetica-Bold").text(sec.letter, 56, y + 4);
        // Label
        doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text(sec.label, 76, y + 4);
        y += 24;
        // Content box
        const textH = doc.heightOfString(sec.text, { width: pageWidth - 10 });
        doc.rect(50, y, pageWidth, textH + 12).fill(LIGHT_BG).stroke("#e2e8f0");
        doc.fontSize(9).font("Helvetica").fillColor(DARK).text(sec.text, 57, y + 6, { width: pageWidth - 14 });
        y += textH + 20;
      }
    }

    // ── DIAGNÓSTICOS CIAP-2 ────────────────────────────────────────────────────
    if (data.diagnosticos && data.diagnosticos.length > 0) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("DIAGNÓSTICOS CIAP-2", 55, y + 3);
      y += 22;

      for (const d of data.diagnosticos) {
        if (y > doc.page.height - 60) { doc.addPage(); y = 50; }
        doc.rect(50, y, 40, 18).fill(PRIMARY);
        doc.fillColor("white").fontSize(9).font("Helvetica-Bold").text(d.ciapCodigo, 52, y + 4, { width: 36, align: "center" });
        doc.rect(92, y, pageWidth - 42, 18).fill(LIGHT_BG).stroke("#e2e8f0");
        doc.fillColor(DARK).fontSize(9).font("Helvetica").text(d.descricao, 97, y + 4, { width: pageWidth - 50 });
        y += 22;
      }
      y += 4;
    }

    // ── PRESCRIÇÕES ────────────────────────────────────────────────────────────
    if (data.prescricoes && data.prescricoes.length > 0) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50; }
      doc.rect(50, y, pageWidth, 16).fill("#e2e8f0");
      doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("PRESCRIÇÕES", 55, y + 3);
      y += 22;

      for (let i = 0; i < data.prescricoes.length; i++) {
        const rx = data.prescricoes[i];
        if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
        doc.rect(50, y, pageWidth, 14).fill(i % 2 === 0 ? LIGHT_BG : "white").stroke("#e2e8f0");
        doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold").text(`${i + 1}. ${rx.medicamento}`, 56, y + 2);
        y += 14;
        const details = [rx.dosagem, rx.frequencia, rx.duracao].filter(Boolean).join(" · ");
        if (details) {
          doc.fontSize(8).font("Helvetica").fillColor(GRAY).text(details, 66, y, { width: pageWidth - 20 });
          y += 12;
        }
        if (rx.observacoes) {
          doc.fontSize(8).font("Helvetica").fillColor(GRAY).text(`Obs: ${rx.observacoes}`, 66, y, { width: pageWidth - 20 });
          y += 12;
        }
        y += 4;
      }
    }

    // ── RODAPÉ ─────────────────────────────────────────────────────────────────
    const totalPages = (doc as any)._pageBuffer?.length ?? 1;
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(GRAY)
      .text(
        `Documento gerado em ${new Date().toLocaleString("pt-BR")} · Prontuário Eletrônico - Atenção Básica`,
        50,
        doc.page.height - 40,
        { width: pageWidth, align: "center" }
      );

    doc.end();
  });
}
