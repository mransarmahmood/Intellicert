-- CSP Study Hub CMS Database Schema
CREATE DATABASE IF NOT EXISTS csp_studyhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE csp_studyhub;

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
    id VARCHAR(20) PRIMARY KEY,
    number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    weight INT NOT NULL DEFAULT 0,
    color_hex VARCHAR(10) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) NOT NULL DEFAULT 'fa-shield-halved',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_key VARCHAR(50) NOT NULL,
    domain_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subtitle TEXT,
    icon VARCHAR(50) DEFAULT 'fa-book',
    overview LONGTEXT,
    image_url VARCHAR(500) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    UNIQUE KEY unique_topic (domain_id, topic_key)
);

-- Concepts table
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    image_url VARCHAR(500) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Topic extras (mnemonics, exam tips, formulas, regulations, diagrams)
CREATE TABLE IF NOT EXISTS topic_extras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    extra_type ENUM('mnemonic','examtip','formula','regulation','chapter','diagram') NOT NULL,
    content_json LONGTEXT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_key VARCHAR(30) NOT NULL UNIQUE,
    domain_id VARCHAR(20) NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_key VARCHAR(30) NOT NULL UNIQUE,
    domain_id VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_index TINYINT NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- Images tracking
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    entity_type VARCHAR(20),
    entity_id INT,
    file_size INT DEFAULT 0,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30),
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
