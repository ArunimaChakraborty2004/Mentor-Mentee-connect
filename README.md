# 👥 Mentor-Mentee Dashboard

A responsive web-based dashboard designed to streamline mentorship workflows. Built using **HTML/CSS/JavaScript** and powered by **Supabase**, this project enables smooth mentor onboarding, mentee tracking, and secure, role-based dashboard access—all wrapped in a clean, modular interface.

---

## 📁 Project Structure

| File                          | Purpose                                      |
|------------------------------|----------------------------------------------|
| `index.html`                 | Landing page for the dashboard               |
| `register.html`              | User registration form                       |
| `role-selection.html`        | Role-based redirection (mentor/mentee)       |
| `mentor-dashboard.html`      | Mentor-specific dashboard interface          |
| `mentee-portfolios.html`     | Mentee profile and progress tracking         |
| `session-records.html`       | Session logging and history view             |
| `forgot-password.html`       | Password recovery interface                  |
| `internship-guidance.html`   | Resource hub for mentees                     |
| `DATABASE_SETUP.md`          | Supabase schema setup and configuration guide|
| `database-schema-clean.sql` | SQL schema for initializing Supabase DB      |
| `vercel.json`                | Deployment config for Vercel                 |

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage)  
- **Deployment**: [Vercel](https://vercel.com)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mentor-mentee-dashboard.git
cd mentor-mentee-dashboard

### 2. Set Up Supabase
Create a new project on Supabase.

Open the SQL Editor and import database-schema-clean.sql.

Note down your Supabase project credentials and configure environment variables:

env
Copy code
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
### 3. Deploy on Vercel
Connect your GitHub repository to Vercel.

Vercel will automatically detect index.html as the entry point.

Set your environment variables in the Vercel dashboard.

🔐 Features
🔑 Role-based login and dashboard access

📝 Session tracking and mentorship logs

📂 Portfolio view for mentees

📚 Internship guidance resources

🔄 Password recovery flow

🧠 Supabase-powered data storage and authentication

📌 Future Enhancements
💬 Add real-time chat using Supabase Realtime

📅 Integrate calendar scheduling for sessions

⭐ Add mentor feedback and rating system

📁 Enable file uploads for mentee portfolios

🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

📄 License
This project is licensed under the MIT License.

🙌 Acknowledgements
Supabase

Vercel

FontAwesome (if used for icons)

yaml
Copy code

---

### ✅ To Use:
- Replace `your-username` with your actual GitHub username.
- Add a `LICENSE` file if you plan to include one (MIT is commonly used).
- Add issue templates/contribution guidelines if open to contributions.

Let me know if you’d like a dark/light theme toggle, mobile mockups, or sample data for seeding the database.



Ask ChatGPT
