# Prontuário Eletrônico - TODO

## Banco de Dados
- [x] Schema: tabela pacientes
- [x] Schema: tabela atendimentos
- [x] Schema: tabela prontuarios (SOAP)
- [x] Schema: tabela diagnosticos (CIAP-2)
- [x] Schema: tabela sinais_vitais
- [x] Schema: tabela prescricoes
- [x] Schema: tabela ciap2
- [x] Migração e aplicação do schema
- [x] Importar dados CIAP-2 (683 registros)

## Backend (tRPC)
- [x] Router: pacientes (CRUD + busca)
- [x] Router: atendimentos (CRUD + histórico)
- [x] Router: prontuários SOAP (CRUD)
- [x] Router: diagnósticos CIAP-2 (CRUD + busca)
- [x] Router: sinais vitais (CRUD)
- [x] Router: prescrições (CRUD)
- [x] Router: busca CIAP-2 por palavra-chave
- [x] Controle de acesso: isolamento por usuario_id

## Frontend
- [x] Design system e tema global (index.css)
- [x] AppLayout com sidebar de navegação
- [x] Tela de Login / Autenticação OAuth
- [x] Lista de Pacientes com busca
- [x] Cadastro/Edição de Paciente
- [x] Histórico de Atendimentos do Paciente
- [x] Novo Atendimento
- [x] Prontuário SOAP completo
- [x] Busca CIAP-2 com sugestões automáticas
- [x] Módulo de Sinais Vitais
- [x] Módulo de Prescrição
- [x] Visualização detalhada do Atendimento
- [x] Navegação e rotas

## Qualidade
- [x] Testes vitest para routers principais (14 testes passando)
- [x] Validação de formulários (zod)
- [x] Estados de loading/erro/vazio
- [x] Responsividade mobile

## Bugs
- [x] Corrigir erro ao salvar sinais vitais (falha na inserção na tabela sinais_vitais com campos numéricos)
- [x] Exportar prontuário completo em PDF (SOAP + sinais vitais + diagnósticos CIAP-2 + prescrições)
- [x] Dicas visuais (placeholders) nos campos de sinais vitais
- [x] Exportar prontuário em PDF (SOAP + sinais vitais + CIAP-2 + prescrições)
- [x] Campo de observações gerais no atendimento (separado do SOAP)

## Supervisão Acadêmica em Tempo Real
- [x] Schema: tabelas conexoes_supervisao e sessoes_supervisao
- [x] Backend Socket.io: sala por professor, emissão de eventos do prontuário
- [x] tRPC: gerar código de convite, listar alunos conectados, histórico de sessões
- [x] Frontend aluno: botão conectar/desconectar ao professor, emissão de atualizações
- [x] Painel professor: lista de alunos conectados, visualização em tempo real do prontuário
- [x] Isolamento total: aluno não vê dados de outros alunos
- [x] Rastreabilidade: registro de sessões com professor/aluno/horário
