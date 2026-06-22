
Please regarding the existing project, it is currently a frontend prototype that was created with AI assistance to help establish the UI/UX, pages, and general structure. It was not built as a complete production ERP system yet.
I would like the project to be properly reviewed and upgraded into a production-grade system with the required architecture, backend, database, security, authentication, authorization, and other necessary ERP/POS functionalities.

Kindly audit the existing codebase first and advise on what can be reused and what needs to be rebuilt to achieve the required standard.

For deployment, I don't have the current hosting/server details because the prototype was mainly used for development and testing. I will need your recommendation and assistance with setting up the proper production hosting environment.
Also, if after your review you determine that it would be better to approach it as a fresh project/build in order to deliver a proper production-grade ERP/POS system, I am open to that.

My priority is having a secure, scalable, and maintainable system that meets the required standard rather than just extending a prototype.

Build a **production-grade Business Management System (ERP/POS Platform)** for **Maxbuy Ventures**, a retail, wholesale, and distribution company, using a modern, scalable, secure, and maintainable architecture.

# Primary Objective

Develop a complete business management platform that digitizes and automates:

* Inventory Management
* Point of Sale (POS)
* Sales & Invoicing
* Customer Management
* Supplier Management
* Accounting & Finance
* Reporting & Analytics
* Staff & Role Management
* Multi-Branch Operations (future-ready)
* AI-Powered Business Insights

The system must support both online and offline operations and be scalable enough to evolve into a full ERP solution.

## Installable Applications Required

### 1. Progressive Web App (PWA)

Create an installable PWA that supports:

* Add to Home Screen
* Offline functionality
* Service Workers
* Background Sync
* Push Notifications
* Cached inventory and sales data
* Offline transaction processing
* Automatic synchronization when internet is restored

## 2. Android App

Package the system for Android using:

* Capacitor.js (preferred)
* PWABuilder
* Android Studio

Deliverables:

* APK build
* AAB build
* Play Store-ready configuration

## 3. Desktop Application

Create a Windows desktop version using:

* Electron.js or Tauri

Features:

* Native installation
* Offline operation
* Desktop notifications
* Local data caching
* Automatic updates architecture

---

## Technology Stack

## Frontend

* Next.js (React + TypeScript)
* Tailwind CSS
* ShadCN UI / Material UI
* Zustand or Redux Toolkit
* TanStack Query

## Backend

* Node.js
* NestJS
* REST APIs
* Swagger Documentation

## Database

* PostgreSQL
* Prisma ORM

## Offline Storage

* IndexedDB
* Dexie.js / LocalForage

## DevOps

* Docker
* Docker Compose
* GitHub Actions
* Nginx
* Vercel / AWS / Railway / Render

---

## Security & Authenticity Requirements

Implement enterprise-grade security and user authenticity controls.

## Authentication

* JWT Authentication
* Refresh Token Rotation
* Secure HTTP-only Cookies
* Password Hashing (bcrypt)
* OTP Verification
* Password Reset
* Session Management
* Multi-device Login Tracking

## Authorization

Role-Based Access Control (RBAC):

* Super Admin
* Admin
* Cashier
* Inventory Manager
* Accountant
* Sales Staff

Granular permissions for:

* Create
* Read
* Update
* Delete
* Export
* Approve
* User Management

## Security Controls

* HTTPS Enforcement
* CSRF Protection
* XSS Protection
* SQL Injection Prevention
* Input Validation
* API Rate Limiting
* Helmet Security Headers
* Audit Logs
* Encrypted Backups
* Secure Environment Variables
* Data Encryption at Rest and in Transit

## Business Authenticity & Data Integrity

* Unique Invoice Numbers
* Unique SKU Generation
* Barcode Validation
* Transaction Audit Trail
* Stock Movement Logs
* User Activity Logs
* Financial Record History
* Soft Delete & Recovery Mechanisms
* Data Synchronization Conflict Resolution
* Backup & Disaster Recovery Strategy

---

## Core Modules

## Inventory Management

* Product catalog
* Barcode scanning
* SKU generation
* Stock tracking
* Expiry monitoring
* Stock transfers
* Low-stock alerts
* Inventory valuation

## POS & Sales

* Fast checkout
* Barcode scanning
* Discounts
* Multiple payment methods
* Receipt printing
* PDF invoices
* Refunds
* Offline sales processing

## Customers

* Customer profiles
* Purchase history
* Credit/debt tracking
* Loyalty program
* Customer analytics

## Suppliers

* Supplier records
* Purchase orders
* Payment tracking
* Performance analytics

## Accounting

* Income and expenses
* Profit & loss
* Cash flow
* Debt management
* Financial reporting

## Reports & Analytics

* Sales trends
* Best-selling products
* Inventory valuation
* Customer insights
* Branch performance

## AI Assistant

* Sales forecasting
* Reorder recommendations
* Inventory optimization
* Automated business summaries

---

## Architecture Requirements

Use:

* Modular Monorepo Architecture
* API-First Design
* Offline-First Design
* Domain-Driven Structure
* Clean Architecture Principles
* SOLID Principles

Structure the application to support future expansion into a multi-branch ERP platform without major redesign.

---

## Expected Deliverables

The developer should deliver:

1. Complete Frontend Application
2. Complete Backend API
3. PostgreSQL Database Schema
4. Prisma Models
5. Authentication & Authorization System
6. PWA Configuration
7. Android Packaging Setup (APK/AAB)
8. Desktop Packaging Setup
9. Offline Synchronization Engine
10. Docker Deployment Configuration
11. CI/CD Pipeline
12. API Documentation
13. User Documentation
14. Installation & Deployment Guides
15. Automated Tests
16. Production Security Configuration

### Final Outcome

A **secure, installable, offline-capable, enterprise-grade ERP/POS platform** for Maxbuy Ventures that runs on **Web, Android, and Windows Desktop**, with strong authentication, data integrity, auditability, and future scalability for multi-branch business operations...