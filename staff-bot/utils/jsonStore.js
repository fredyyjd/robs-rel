const fs = require('fs');
const path = require('path');

// A tiny, dependency-free JSON-file store (no database needed).
// Writes go to a temp file first and are then renamed, so a crash in the
// middle of a save can't leave a half-written file behind.
function createStore(fileName, defaultValue = {}) {
  const filePath = path.join(__dirname, '..', 'data', fileName);

  function ensure() {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    }
  }

  function readAll() {
    ensure();
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return { ...defaultValue };
    }
  }

  function writeAll(data) {
    ensure();
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, filePath);
  }

  return {
    get(key) {
      return readAll()[key];
    },
    set(key, value) {
      const data = readAll();
      data[key] = value;
      writeAll(data);
    },
    delete(key) {
      const data = readAll();
      delete data[key];
      writeAll(data);
    },
    all() {
      return readAll();
    },
  };
}

module.exports = createStore;
