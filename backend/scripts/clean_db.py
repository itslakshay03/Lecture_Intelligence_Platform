import sqlite3
from pathlib import Path

db_paths = ['data/tasks.db', 'tasks.db']
for p in db_paths:
    if Path(p).exists():
        print(f'Found DB at: {p}')
        conn = sqlite3.connect(p)
        c = conn.cursor()
        c.execute('SELECT status, count(*) FROM tasks GROUP BY status')
        rows = c.fetchall()
        print('Current task counts:', rows)
        c.execute("UPDATE tasks SET status='failed', error='Server restarted - task interrupted' WHERE status='processing'")
        print(f'Reset {c.rowcount} stuck tasks')
        conn.commit()
        conn.close()
        break
