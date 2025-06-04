-- Database creation
CREATE DATABASE IF NOT EXISTS university_app;
USE university_app;

-- Users table (students)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student') NOT NULL,
    branch VARCHAR(255),
    personal_details JSON,
    education JSON,
    skills JSON,
    work_experience JSON,
    projects JSON,
    certifications JSON,
    achievements JSON,
    languages JSON,
    hobbies JSON,
    resume_references JSON,
    can_edit_profile BOOLEAN DEFAULT FALSE
);

-- Faculty table
CREATE TABLE faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('faculty') NOT NULL,
    branch VARCHAR(255)
);

-- Super Admins table
CREATE TABLE super_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin') NOT NULL
);

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE NOT NULL,
    role_flag ENUM('student', 'faculty', 'super_admin') NOT NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- Tickets table
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    response TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resume Templates table
CREATE TABLE resume_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content JSON NOT NULL
);

-- Resumes table
CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    template_id INT NOT NULL,
    resume_data JSON NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES resume_templates(id) ON DELETE CASCADE
);
