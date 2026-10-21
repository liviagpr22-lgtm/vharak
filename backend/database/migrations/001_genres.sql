-- Migration 001: generos de jogos (permite filtro e catalogo por genero)
-- Compativel com o esquema existente: apenas cria tabelas novas e insere dados.
-- Nao altera nem apaga tabelas ou colunas pre-existentes.

CREATE TABLE IF NOT EXISTS `genres` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_genres` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `genre_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_genre` (`product_id`,`genre_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_genre` (`genre_id`),
  CONSTRAINT `product_genres_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_genres_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `genres` (`name`, `slug`) VALUES
  ('Acao',          'acao'),
  ('Aventura',      'aventura'),
  ('Corrida',       'corrida'),
  ('Esportes',      'esportes'),
  ('Estrategia',    'estrategia'),
  ('Luta',          'luta'),
  ('Plataforma',    'plataforma'),
  ('RPG',           'rpg'),
  ('Simulacao',     'simulacao'),
  ('Terror',        'terror'),
  ('Tiro',          'tiro'),
  ('Outros',        'outros')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
