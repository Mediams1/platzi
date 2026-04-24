-- Platzi Lite Database Schema
-- Optimized for Educational Platforms

CREATE DATABASE IF NOT EXISTS platzi_lite;
USE platzi_lite;

-- Users Table
CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE courses (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(500),
    price DECIMAL(10, 2) DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    total_students INT DEFAULT 0,
    instructor_id VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Lessons Table
CREATE TABLE lessons (
    id VARCHAR(128) PRIMARY KEY,
    course_id VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    position INT NOT NULL, -- To enforce sequence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Enrollments & Progress Tracking
CREATE TABLE enrollments (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    course_id VARCHAR(128) NOT NULL,
    last_watched_lesson_id VARCHAR(128),
    completed_lessons JSON, -- Store array of completed lesson IDs
    is_fully_completed BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Reviews Table
CREATE TABLE reviews (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    course_id VARCHAR(128) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
