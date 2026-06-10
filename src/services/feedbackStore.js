console.log("hello world");

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

class FeedbackStore {
  constructor(filePath = path.join(process.cwd(), "data", "feedback.json")) {
    this.filePath = filePath;
  }

  async append(feedback) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    let entries = [];
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      entries = JSON.parse(raw);
      if (!Array.isArray(entries)) {
        entries = [];
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    const entry = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      ...feedback,
    };

    entries.push(entry);
    await fs.writeFile(this.filePath, JSON.stringify(entries, null, 2));
    return entry;
  }
}

module.exports = { FeedbackStore };
