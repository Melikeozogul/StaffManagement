# StaffManagement

StaffManagement is a web-based employee and project management system developed with **ASP.NET Core Web API**, **React**, **MySQL**, and **Entity Framework Core**.

The application allows organizations to manage staff, roles, projects, and tasks through a centralized management interface.

## 🚀 Features

- 👤 Staff management
- 🏢 Role management
- 📁 Project management
- ✅ Task management
- 👥 Assign registered staff to tasks
- 🔗 Assign tasks to projects
- 📊 Monthly task and earnings reports
- 🔍 View task details and related staff/project information
- 🌐 RESTful API architecture
- 📖 Swagger API documentation

## 🛠️ Technologies

### Backend
- C#
- ASP.NET Core Web API
- Entity Framework Core
- MySQL
- Swagger / OpenAPI

### Frontend
- React
- JavaScript
- Tailwind CSS

### Development Tools
- Git & GitHub
- Visual Studio Code
- MySQL Workbench

## 📂 Project Structure

```text
StaffManagement/
│
├── StaffManagement.API/
│   ├── Controllers/
│   ├── Models/
│   ├── Data/
│   ├── Services/
│   └── Program.cs
│
├── StaffManagement.UI/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── ...
│
└── README.md
```

## 🗄️ Database Structure

The application uses MySQL with the following main entities:

- **Role**
- **Staff**
- **Project**
- **Task**

Relationships between these entities are managed using **Entity Framework Core**.

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Melikeozogul/StaffManagement.git
cd StaffManagement
```

### 2. Configure the database

Make sure MySQL is installed and running.

Create the `StaffManagement` database and configure the connection string in the backend:

```text
Server=localhost;
Port=3306;
Database=StaffManagement;
User=root;
Password=;
```

### 3. Run the Backend

Navigate to the API directory:

```bash
cd StaffManagement.API
```

Run the application:

```bash
dotnet run
```

The API can be tested through Swagger.

### 4. Run the Frontend

Open a new terminal and navigate to the frontend:

```bash
cd StaffManagement.UI
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## 📖 API Documentation

Swagger is available when the ASP.NET Core API is running.

You can use Swagger to test the available endpoints and inspect API requests and responses.

## 📊 Reporting

The system provides monthly reports by grouping tasks according to:

- Year
- Month
- Staff
- Project

It also calculates total working hours and total earnings.

## 🔮 Future Improvements

- Authentication and authorization
- JWT-based user authentication
- Advanced dashboard and analytics
- Employee performance tracking
- Task status management
- Notifications
- Role-based authorization
- Advanced filtering and search

## 👩‍💻 Author

**Melike Özoğul**

Software Engineer

GitHub: https://github.com/Melikeozogul
