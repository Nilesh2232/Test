# Support Ticketing CRM

Full-stack customer support ticketing system with SQLite, FastAPI, and a simple HTML/Tailwind frontend.

## Features

- Create tickets (customer name, email, subject, description; auto ticket ID + timestamp)
- List all tickets (ID, name, title, status, date)
- Search across names, IDs, emails, subjects, and descriptions
- Filter by status: Open, In Progress, Closed
- View ticket details and update status / add notes

## Tech stack

- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** SQLite
- **Frontend:** Jinja2 templates, Tailwind CSS (CDN), vanilla JavaScript

## Project structure

```
Backend/
  app/                 # FastAPI app, models, API (app/main.py is the entrypoint)
  requirements.txt
  Procfile             # Deploy command (Railway)
  .env.example
  .gitignore
Frontend/
  templates/           # HTML pages
  static/              # CSS & JS
```

## Setup

1. Clone the repository
2. Create and activate a virtual environment from the Backend folder

```bash
cd Backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Copy environment file

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

5. Run the app (still inside Backend)

```bash
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000

API docs: http://127.0.0.1:8000/docs

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tickets` | Create ticket |
| `GET` | `/api/tickets` | List tickets (`?status=` `&search=`) |
| `GET` | `/api/tickets/{ticket_id}` | Ticket detail + notes |
| `PUT` | `/api/tickets/{ticket_id}` | Update status and/or add note |

### Example create body

```json
{
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "subject": "Login issue",
  "description": "Cannot reset password"
}
```

## Deploy (Railway)

1. Push this repo to GitHub
2. Create a new Railway project
3. Set the Railway **Root Directory** to `Backend`
4. Railway will use `Backend/Procfile` to start uvicorn
5. Optional: set `DATABASE_URL=sqlite:///./tickets.db`

> Note: SQLite on Railway is fine for this assignment MVP. Data may reset if the filesystem is ephemeral.

## License

MIT
