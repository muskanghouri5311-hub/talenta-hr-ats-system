# Talenta – HR & Applicant Tracking System

Talenta is a full-stack HR and Applicant Tracking System (ATS) designed to help HR teams manage job requisitions, candidates, applications, interviews, recruitment workflows, and reports from one platform.

## Features

- User authentication and role-based access control
- Job requisition management
- Candidate and application management
- ATS-based candidate scoring
- Interview scheduling and management
- Interview feedback
- Offer letter management
- HR dashboards and analytics
- Reports and recruitment insights
- Career portal for job applications
- Protected routes and secure API access
- Resume/CV file upload
- Email notifications

## Tech Stack

### Frontend

- React.js
- Vite
- React Router
- Axios
- Tailwind CSS
- React Hook Form

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Multer
- Nodemailer

### Other Technologies

- Cloudinary
- REST APIs
- Role-Based Access Control

## User Roles

- Super Admin
- Recruiter
- HR Manager
- Interviewer

Each role has different permissions based on the recruitment workflow.

## Project Structure

```text
talenta-hr-ats-system/
│
├── hr-ats-system-be/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ...
│
├── hr-ats-system-fe/
│   ├── src/
│   ├── pages/
│   ├── components/
│   └── ...
│
├── screenshots/
│   ├── dashboard.png
│   ├── ats-ranking.png
│   ├── candidate-pipeline.png
│   ├── job-requisitions.png
│   ├── career-portal.png
│   ├── roles-and-permissions.png
│   ├── audit-log.png
│   └── login.png
│
└── README.md