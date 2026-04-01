CREATE TABLE `codigos_convite` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professor_id` int NOT NULL,
	`codigo` varchar(12) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codigos_convite_id` PRIMARY KEY(`id`),
	CONSTRAINT `codigos_convite_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `conexoes_supervisao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`codigo_usado` varchar(12),
	`ativa` int NOT NULL DEFAULT 1,
	`iniciada_em` timestamp NOT NULL DEFAULT (now()),
	`encerrada_em` timestamp,
	CONSTRAINT `conexoes_supervisao_id` PRIMARY KEY(`id`),
	CONSTRAINT `conexoes_supervisao_aluno_id_unique` UNIQUE(`aluno_id`)
);
--> statement-breakpoint
CREATE TABLE `sessoes_supervisao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aluno_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`iniciada_em` timestamp NOT NULL DEFAULT (now()),
	`encerrada_em` timestamp,
	`duracao_segundos` int,
	CONSTRAINT `sessoes_supervisao_id` PRIMARY KEY(`id`)
);
