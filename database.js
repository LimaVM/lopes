const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const path = require('path')

const file = path.join(__dirname, 'data', 'db.json')
const adapter = new JSONFile(file)
const defaultData = { users: [], animals: [], monitoring_data: [], counters: { users: 0, animals: 0, monitoring_data: 0 } }
const db = new Low(adapter, defaultData)

async function initDB() {
  await db.read()
  await db.write()
}

function nextId(collection) {
  const id = ++db.data.counters[collection]
  return id
}

module.exports = { db, initDB, nextId }
