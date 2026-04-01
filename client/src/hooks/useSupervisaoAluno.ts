import { useEffect, useRef, useCallback } from "react";
import { getSocket } from "./useSocket";
import type { ProntuarioUpdate } from "../../../server/socketSupervision";

export function useSupervisaoAluno(professorId: number | null | undefined) {
  const entrou = useRef(false);

  // Entrar na sala de supervisão quando conectado ao professor
  useEffect(() => {
    if (!professorId) return;
    const socket = getSocket();

    const onConnect = () => {
      if (!entrou.current) {
        socket.emit("aluno:entrar_supervisao", { professorId });
        entrou.current = true;
      }
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
      socket.once("connect", onConnect);
    }

    return () => {
      socket.off("connect", onConnect);
      entrou.current = false;
    };
  }, [professorId]);

  // Emitir atualização do prontuário em tempo real
  const emitirUpdate = useCallback(
    (update: Omit<ProntuarioUpdate, "timestamp">) => {
      if (!professorId) return;
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("aluno:prontuario_update", update);
      }
    },
    [professorId]
  );

  // Sair da supervisão
  const sairSupervisao = useCallback(() => {
    const socket = getSocket();
    socket.emit("aluno:sair_supervisao");
    entrou.current = false;
  }, []);

  return { emitirUpdate, sairSupervisao };
}
