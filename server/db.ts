import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");

type DbSchema = {
  users: any[];
  globalCounter: { id: number; totalClicks: number; updatedAt: string };
  countryStats: any[];
  onlineUsers: Record<string, number>; // IP -> lastSeen timestamp
};

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DbSchema = {
        users: [],
        globalCounter: { id: 1, totalClicks: 0, updatedAt: new Date().toISOString() },
        countryStats: [
          { id: 1, countryCode: "US", countryName: "United States", totalClicks: 0, userCount: 0 },
          { id: 2, countryCode: "GB", countryName: "United Kingdom", totalClicks: 0, userCount: 0 },
          { id: 3, countryCode: "CA", countryName: "Canada", totalClicks: 0, userCount: 0 },
        ],
        onlineUsers: {},
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    if (!data.onlineUsers) data.onlineUsers = {};
    return data;
  } catch (e) {
    console.error("Error reading DB:", e);
    return {
      users: [],
      globalCounter: { id: 1, totalClicks: 0, updatedAt: new Date().toISOString() },
      countryStats: [],
      onlineUsers: {},
    };
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing DB:", e);
  }
}

export async function getDb() {
  return { isJson: true };
}

export async function upsertUser(user: any): Promise<void> {
  const db = readDb();
  const index = db.users.findIndex((u) => u.openId === user.openId);
  const now = new Date().toISOString();
  if (index >= 0) {
    db.users[index] = { ...db.users[index], ...user, updatedAt: now };
  } else {
    db.users.push({ ...user, id: db.users.length + 1, createdAt: now, updatedAt: now });
  }
  writeDb(db);
}

export async function getUserByOpenId(openId: string) {
  const db = readDb();
  return db.users.find((u) => u.openId === openId);
}

export async function getGlobalCounter() {
  const db = readDb();
  return db.globalCounter;
}

export async function getCountryLeaderboard(limit: number = 10) {
  const db = readDb();
  return [...db.countryStats]
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, limit);
}

export async function getCountryStats(countryCode: string) {
  const db = readDb();
  return db.countryStats.find((c) => c.countryCode === countryCode);
}

export async function getUserStats(userId: number) {
  const db = readDb();
  return db.users.find((u) => u.id === userId);
}

export async function initializeGlobalCounter() {
  readDb();
}

export async function initializeCountry(countryCode: string, countryName: string) {
  const db = readDb();
  if (!db.countryStats.find((c) => c.countryCode === countryCode)) {
    db.countryStats.push({
      id: db.countryStats.length + 1,
      countryCode,
      countryName,
      totalClicks: 0,
      userCount: 0,
      updatedAt: new Date().toISOString(),
    });
    writeDb(db);
  }
}

export async function updateOnlineStatus(ip: string) {
  const db = readDb();
  db.onlineUsers[ip] = Date.now();
  
  // Cleanup old sessions (older than 30 seconds)
  const now = Date.now();
  for (const key in db.onlineUsers) {
    if (now - db.onlineUsers[key] > 30000) {
      delete db.onlineUsers[key];
    }
  }
  
  writeDb(db);
  return Object.keys(db.onlineUsers).length;
}

export async function getOnlineUserCount() {
  const db = readDb();
  const now = Date.now();
  return Object.values(db.onlineUsers).filter(time => now - time < 30000).length;
}

export async function incrementGlobalCounter() {
  const db = readDb();
  db.globalCounter.totalClicks += 1;
  db.globalCounter.updatedAt = new Date().toISOString();
  writeDb(db);
  return db.globalCounter;
}

export async function incrementCountryStats(countryCode: string) {
  const db = readDb();
  const country = db.countryStats.find((c) => c.countryCode === countryCode);
  if (country) {
    country.totalClicks += 1;
    country.updatedAt = new Date().toISOString();
    writeDb(db);
  }
  return country;
}

export async function incrementUserClicks(userId: number, countryCode: string) {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.totalClicks = (user.totalClicks || 0) + 1;
    user.country = countryCode;
    user.updatedAt = new Date().toISOString();
    writeDb(db);
  } else {
    const newUser = {
      id: userId,
      openId: `demo-${userId}`,
      name: "Demo User",
      totalClicks: 1,
      country: countryCode,
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDb(db);
  }
  return db.users.find((u) => u.id === userId);
}
