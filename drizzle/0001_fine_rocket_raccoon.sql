CREATE TABLE `atendimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`usuario_id` int NOT NULL,
	`data_atendimento` timestamp NOT NULL DEFAULT (now()),
	`tipo` enum('consulta','visita_domiciliar','procedimento','retorno','urgencia') DEFAULT 'consulta',
	`local` enum('ubs','domicilio','outro') DEFAULT 'ubs',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atendimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ciap2` (
	`codigo` varchar(10) NOT NULL,
	`descricao` text NOT NULL,
	CONSTRAINT `ciap2_codigo` PRIMARY KEY(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prontuario_id` int NOT NULL,
	`ciap_codigo` varchar(10) NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pacientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`cns` varchar(20),
	`data_nascimento` date,
	`sexo` enum('masculino','feminino','outro'),
	`telefone` varchar(20),
	`endereco` text,
	`nome_mae` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pacientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescricoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prontuario_id` int NOT NULL,
	`medicamento` varchar(255) NOT NULL,
	`dosagem` varchar(100),
	`frequencia` varchar(100),
	`duracao` varchar(100),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prescricoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prontuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimento_id` int NOT NULL,
	`subjetivo` text,
	`objetivo` text,
	`avaliacao` text,
	`plano` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prontuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `prontuarios_atendimento_id_unique` UNIQUE(`atendimento_id`)
);
--> statement-breakpoint
CREATE TABLE `sinais_vitais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prontuario_id` int NOT NULL,
	`pressao_arterial` varchar(20),
	`frequencia_cardiaca` int,
	`temperatura` decimal(4,1),
	`saturacao` int,
	`glicemia` decimal(6,1),
	`peso` decimal(5,2),
	`altura` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sinais_vitais_id` PRIMARY KEY(`id`),
	CONSTRAINT `sinais_vitais_prontuario_id_unique` UNIQUE(`prontuario_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_atendimento_paciente` ON `atendimentos` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `idx_paciente_usuario` ON `pacientes` (`usuario_id`);