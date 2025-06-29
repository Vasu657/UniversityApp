# UniversityApp

Welcome to **UniversityApp**, a comprehensive university management application designed to streamline administrative tasks, facilitate communication, and enhance the academic experience for students, faculty, and super admins. This is a public repository hosted at [https://github.com/Vasu657/UniversityApp.git](https://github.com/Vasu657/UniversityApp.git).

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Dashboards](#dashboards)
  - [Student Dashboard](#student-dashboard)
  - [Faculty Dashboard](#faculty-dashboard)
  - [Super Admin Dashboard](#super-admin-dashboard)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## Overview
UniversityApp is a full-stack web and mobile application designed to manage university operations efficiently. It provides role-based access for students, faculty, and super admins, enabling them to perform tasks such as profile management, task assignment, ticket submission, resume generation, and administrative oversight. The application is built with a Node.js backend and a React Native frontend, integrated with a MySQL database.

## Features
- **User Management**: Supports three user roles—students, faculty, and super admins—with distinct permissions.
- **Profile Management**: Users can update personal details, education, skills, work experience, projects, certifications, achievements, languages, hobbies, and resume references.
- **Task Management**: Faculty and super admins can assign tasks to students or faculty, track progress, and manage deadlines.
- **Ticket System**: Students can submit profile edit requests, which super admins can approve or decline.
- **Resume Generation**: Students can create resumes using predefined templates tailored to their branch.
- **Role-Based Dashboards**: Custom dashboards for each user role with relevant features and data visualizations.
- **Secure Authentication**: Passwords are hashed (using bcrypt) for secure user authentication.
- **Responsive Design**: The frontend is built with React Native, ensuring compatibility across web, iOS, and Android platforms.

## Dashboards
UniversityApp includes three role-specific dashboards, each tailored to the needs of its users.

### Student Dashboard
**Purpose**: Provides students with tools to manage their academic and professional profiles.

**Features**:
- **Profile Management**: 
  - View and edit personal details (e.g., name, email, phone, address, profile photo).
  - Update education, skills, work experience, projects, certifications, achievements, languages, hobbies, and resume references (subject to admin approval).
- **Task Management**:
  - View tasks assigned by faculty or super admins.
  - Update task status (pending, in-progress, completed) and add notes or links.
  - Example tasks: "Complete the assessment by tomorrow" or "Rectify the error in the code."
- **Ticket Submission**:
  - Submit requests to edit profile details, which are reviewed by super admins.
  - View ticket status (pending, approved, declined, resolved) and admin responses.
- **Resume Generation**:
  - Create and download resumes using branch-specific templates.
  - Store resume data in JSON format for easy retrieval and updates.

### Faculty Dashboard
**Purpose**: Enables faculty to manage tasks and monitor student progress.

**Features**:
- **Task Assignment**:
  - Assign tasks to students or other faculty members.
  - Specify task details, due dates, and links (e.g., Google Drive or YouTube).
  - Track task status and view student updates.
- **Profile Viewing**:
  - View personal profile details (name, email, branch).
- **Task Monitoring**:
  - Monitor tasks assigned to them or by them, including status and notes.
  - Example: "Update the Dashboard of the faculty" with a due date of 2025-06-05.
- **Dashboard Updates**:
  - Limited ability to update dashboard content, as seen in tasks like "Update the Dashboard of the faculty."

### Super Admin Dashboard
**Purpose**: Provides administrative oversight and control over the entire application.

**Features**:
- **User Management**:
  - View and manage all user accounts (students, faculty, super admins).
  - Approve or decline profile edit requests submitted via tickets.
- **Ticket Management**:
  - Review and respond to student-submitted tickets.
  - Update ticket status (pending, approved, declined, resolved) and add responses (e.g., "Your request has been approved. Thank you for your patience.").
- **Task Oversight**:
  - Assign tasks to faculty or students.
  - Monitor all tasks across the system for compliance and progress.
- **System Configuration**:
  - Manage resume templates for different branches.
  - Configure system settings, such as user permissions and branch-specific options.

## Technologies Used
- **Backend**:
  - Node.js
  - Express.js
  - MySQL (Database)
  - bcrypt (Password Hashing)
- **Frontend**:
  - React Native
  - Expo (for mobile development)
- **Database**:
  - MySQL 8.0.41
- **Other Tools**:
  - Git (Version Control)
  - NekGitHub (Repository Hosting)
  - npm (Package Management)

## Project Structure
```bash
UniversityApp/
├── backend/
│   ├── server.js               # Entry point for the Node.js backend
│   ├── routes/                 # API routes for users, tasks, tickets, etc.
│   ├── models/                 # Database models (e.g., User, Faculty, Task)
│   ├── controllers/            # Business logic for API endpoints
│   └── config/                 # Database configuration and environment variables
├── frontend/
│   ├── App.js                  # Main React Native application file
│   ├── components/             # Reusable UI components
│   ├── screens/                # Screens for dashboards (Student, Faculty, Super Admin)
│   ├── navigation/             # Navigation setup for the app
│   └── assets/                 # Images, fonts, and other static assets
├── database/
│   ├── university_app.sql      # MySQL database schema and seed data
│   └── migrations/             # Database migration scripts
├── README.md                   # Project documentation
└── package.json                # Project dependencies and scripts

```
## Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **Expo CLI** (`npm install -g expo-cli`)
- **Git** (for cloning the repository)
- **npm** (comes with Node.js)
- A MySQL database instance (local or hosted)

### Backend Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Vasu657/UniversityApp.git
   cd UniversityApp/backend

2. **Install Dependencies**:
   ```bash
   npm install

3. **Configure Environment Variables**:
- Create a .env file in the backend directory.
- Add the following variables:
  ```bash
  DB_HOST=localhost
  DB_USER=your_mysql_user
  DB_PASSWORD=your_mysql_password
  DB_NAME=university_app
  PORT=3000
  
4. **Set Up the intrinsic Database**:
- Create a MySQL database named university_app.
- Import the provided SQL dump:
- ```bash
  mysql -u your_mysql_user -p university_app < database/university_app.sql

5. **Start the Backend Server**:
   ```bash
   node server.js

## Frontend Setup
1. **Navigate to the Frontend Directory**:
   ```bash
   cd ../frontend
   
2. **Install Dependencies:**
   ```bash
   npm install
   
3. **Configure API Endpoint**:
- Update the API base URL in the frontend code (e.g., in frontend/config.js or similar) to point to the backend:
   ```bash
   export const API_BASE_URL = 'http://localhost:3000/api';
   
4. **Start the Frontend:**
   ```bash
   npx expo start --tunnel

## Running the Application
1. **Backend:**
   ```bash
   cd backend
    node server.js
   
2. **Frontend:**
   ```bash
   cd frontend
    npx expo start --tunnel
   
Follow the Expo CLI instructions to run the app on a mobile device, emulator, or web browser.
## Database Schema
The `university_app` database includes the following tables:

- **`users`**:
  - Stores student, faculty, and super admin details.
  - Includes JSON fields for profile data (e.g., personal details, education, skills, work experience, projects, certifications, achievements, languages, hobbies, resume references).

- **`faculty`**:
  - Stores faculty-specific data.
  - Fields: name, email, branch, password.

- **`super_admins`**:
  - Stores super admin data.
  - Fields: name, email, branch, password.

- **`tasks`**:
  - Manages tasks assigned to users.
  - Fields: status, due date, notes, and other task-related details.

- **`tickets`**:
  - Handles profile edit requests.
  - Fields: status, response, and other ticket-related details.

- **`resumes`**:
  - Stores student-generated resumes.
  - Includes JSON data and template references.

- **`resume_templates`**:
  - Stores branch-specific resume templates.

For detailed schema information, refer to the SQL files in the `database` directory.

## Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request on GitHub.
Please ensure your code follows the project's coding standards and includes appropriate tests.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
