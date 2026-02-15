Schools Map

Web application for displaying schools by district.

Project structure:
- backend/ - FastAPI server, reads and uploads Excel data.
- frontend/ - React + Vite client with map UI.

Requirements:
- Python 3.12+
- Node.js 20+

Run backend:
1) cd backend
2) pip install -r requirements.txt
3) uvicorn app:app --reload

Backend default URL: http://127.0.0.1:8000

Run frontend:
1) cd frontend
2) npm install
3) npm run dev

Frontend default URL: http://127.0.0.1:5173

Main API endpoints:
- GET /api/health - service check
- GET /api/districts - district list
- GET /api/districts/{district_id}/schools - schools in district
- POST /api/admin/login - admin login
- POST /api/admin/logout - admin logout
- POST /api/admin/data/upload - upload Excel (.xlsx)
- GET /api/admin/data/download - download Excel
- GET /api/admin/data/exists - check Excel file exists

Admin credentials (current):
- login: admin
- password: admin

Data file: backend/database/data.xlsx