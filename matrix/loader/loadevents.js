const fs = require("fs")
const path = require("path")
const eventsPath = path.join(__dirname, "../events")
let eventFiles
try {
  eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))
} catch (err) {
  console.error("Error reading events directory:", err)
  process.exit(1)
}
module.exports = client => {
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file)
    let event
    try {
      event = require(filePath)
    } catch (err) {
      console.error(`Error requiring event file ${file}:`, err)
      continue
    }
    if (event.once) {
      client.once(event.name, async (...args) => {
        try {
          await event.execute(...args)
        } catch (error) {
          console.error(`Error executing event ${event.name}:`, error)
        }
      })
    } else {
      client.on(event.name, async (...args) => {
        try {
          await event.execute(...args)
        } catch (error) {
          console.error(`Error executing event ${event.name}:`, error)
        }
      })
    }
  }
}
