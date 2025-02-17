const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * Loads and registers all slash and prefix commands.
 * For slash commands, this function refreshes the Discord application command registry,
 * erasing any old commands that are not present in the loaded files.
 */
async function loadCommands(client) {
  // Create new maps for commands on the client object
  client.slashCommands = new Map();
  client.prefixCommands = new Map();
  
  // Directories for slash and prefix commands
  const slashDir = path.join(process.cwd(), "commands", "slash");
  const prefixDir = path.join(process.cwd(), "commands", "prefix");
  
  // Recursively load commands from file system into the maps
  await loadDirectory(slashDir, client.slashCommands, true);
  await loadDirectory(prefixDir, client.prefixCommands, false);
  
  console.log(`Loaded ${client.slashCommands.size} slash commands from ${slashDir}`);
  console.log(`Loaded ${client.prefixCommands.size} prefix commands from ${prefixDir}`);

  // If client.application is ready, update Discord's registered slash commands
  // This erases any old, unregistered commands from the Discord registry
  if (client.application && client.application.commands) {
    try {
      // Prepare slash commands data for registration
      const commandsData = Array.from(client.slashCommands.values()).map(item => item.command.data.toJSON());
      // This call completely overwrites the current commands with your new list
      await client.application.commands.set(commandsData);
      console.log(`Discord's application commands updated successfully.`);
    } catch (error) {
      console.error(`Error updating Discord's application commands: ${error.message}`);
    }
  }
}

/**
 * Recursively loads command files from a given directory.
 * 
 * @param {string} directory - The directory to read.
 * @param {Map} collection - The map to store loaded commands.
 * @param {boolean} isSlash - Whether commands are slash commands (true) or prefix commands (false).
 */
async function loadDirectory(directory, collection, isSlash) {
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading directory ${directory}: ${error.message}`);
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    try {
      if (entry.isDirectory()) {
        // Recursively load commands from subdirectories
        await loadDirectory(fullPath, collection, isSlash);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        const command = require(fullPath);
        if (isSlash) {
          // Validate slash command has required properties
          if (command.data && command.execute) {
            // Compute a hash based on the command data for detecting changes
            const hash = crypto.createHash("sha256").update(JSON.stringify(command.data)).digest("hex");
            // If it's a new command or an updated command, add/refresh in the collection
            if (!collection.has(command.data.name)) {
              collection.set(command.data.name, { command, hash });
              console.log(`Slash command loaded: '${command.data.name}' from ${path.relative(process.cwd(), fullPath)}`);
            } else if (collection.get(command.data.name).hash !== hash) {
              collection.set(command.data.name, { command, hash });
              console.log(`Slash command refreshed: '${command.data.name}' from ${path.relative(process.cwd(), fullPath)}`);
            }
          }
        } else {
          // Validate prefix command has required properties
          if (command.name && command.execute) {
            const key = command.name.toLowerCase();
            if (!collection.has(key)) {
              collection.set(key, command);
              console.log(`Prefix command loaded: '${command.name}' from ${path.relative(process.cwd(), fullPath)}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load command from ${path.relative(process.cwd(), fullPath)}: ${error.message}`);
    }
  }
}

module.exports = loadCommands;