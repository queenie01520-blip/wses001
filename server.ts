import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

interface Member {
  id: string;
  nickname: string;
  group: 'A' | 'B';
  timestamp: number;
}

let members: Member[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/members", (req, res) => {
    res.json(members);
  });

  app.post("/api/members", (req, res) => {
    const { id, nickname } = req.body;
    
    if (!id || !nickname) {
      return res.status(400).json({ error: "Missing id or nickname" });
    }

    if (members.length >= 60 && !members.find(m => m.id === id)) {
      return res.status(400).json({ error: "Limit reached" });
    }

    // Check if already in the list
    if (members.find(m => m.id === id)) {
      return res.json({ success: true });
    }

    const groupACount = members.filter(m => m.group === 'A').length;
    const groupBCount = members.filter(m => m.group === 'B').length;

    let assignedGroup: 'A' | 'B' = 'A';
    
    if (groupACount >= 30) {
      assignedGroup = 'B';
    } else if (groupBCount >= 30) {
      assignedGroup = 'A';
    } else if (groupACount > groupBCount) {
      assignedGroup = 'B';
    } else if (groupBCount > groupACount) {
      assignedGroup = 'A';
    } else {
      assignedGroup = Math.random() < 0.5 ? 'A' : 'B';
    }

    const newMember: Member = {
      id,
      nickname: nickname.trim(),
      group: assignedGroup,
      timestamp: Date.now(),
    };
    
    members.push(newMember);
    res.json({ success: true, member: newMember });
  });

  app.delete("/api/members", (req, res) => {
    members = [];
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
