require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { blue, green, red, yellow } = require("colorette");

class CommandLoadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "CommandLoadError";
    this.cause = cause;
  }
}

/**
 * Loads and registers all slash and prefix commands.
 * @param {Client} client - Discord.js client instance
 * @throws {CommandLoadError} When critical loading errors occur
 */
async function loadCommands(client) {
  try {
    // Initialize command collections on the client
    client.slashCommands = new Map();
    client.prefixCommands = new Map();

    const slashDir = path.join(process.cwd(), "commands", "slash");
    const prefixDir = path.join(process.cwd(), "commands", "prefix");

    // Load commands with enhanced error handling
    await Promise.all([
      loadDirectory(slashDir, client.slashCommands, true),
      loadDirectory(prefixDir, client.prefixCommands, false)
    ]);

    console.log(green(`✓ Loaded ${client.slashCommands.size} slash commands`));
    console.log(green(`✓ Loaded ${client.prefixCommands.size} prefix commands`));

    // Update Discord's command registry if available
    if (client.application?.commands) {
      try {
        // Here, each slash command is stored as { command, hash }
        const commandsData = Array.from(client.slashCommands.values()).map(
          (item) => item.command.data.toJSON()
        );
        await client.application.commands.set(commandsData);
        console.log(green("✓ Discord application commands updated successfully"));
      } catch (error) {
        throw new CommandLoadError("Failed to update Discord application commands", error);
      }
    }
  } catch (error) {
    console.error(red("Critical error in command loading:"), error);
    throw error; // Rethrow critical errors so they can be handled upstream
  }
}

/**
 * Recursively loads command files from a directory.
 * @param {string} directory - Directory path to load from
 * @param {Map} collection - Collection to store commands
 * @param {boolean} isSlash - Whether loading slash commands
 */
async function loadDirectory(directory, collection, isSlash) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);

        try {
          if (entry.isDirectory()) {
            await loadDirectory(fullPath, collection, isSlash);
            return;
          }

          if (!entry.isFile() || !entry.name.endsWith(".js")) return;

          // Clear require cache to force fresh loading
          delete require.cache[require.resolve(fullPath)];
          const command = require(fullPath);

          if (isSlash) {
            validateAndLoadSlashCommand(command, fullPath, collection);
          } else {
            validateAndLoadPrefixCommand(command, fullPath, collection);
          }
        } catch (error) {
          const relPath = path.relative(process.cwd(), fullPath);
          console.error(red(`Failed to load command from ${relPath}:`), {
            error: error.message,
            stack: error.stack
          });
        }
      })
    );
  } catch (error) {
    throw new CommandLoadError(`Failed to read directory: ${directory}`, error);
  }
}

/**
 * Validates and loads a slash command.
 * @param {Object} command - The command module
 * @param {string} fullPath - Full path to the command file
 * @param {Map} collection - Collection to store commands
 */
function validateAndLoadSlashCommand(command, fullPath, collection) {
  if (!command.data?.name || !command.execute) {
    throw new CommandLoadError("Invalid slash command structure: missing required properties");
  }

  const hash = crypto.createHash("sha256")
    .update(JSON.stringify(command.data))
    .digest("hex");

  const relativePath = path.relative(process.cwd(), fullPath);
  const commandName = command.data.name;

  if (!collection.has(commandName)) {
    collection.set(commandName, { command, hash });
    console.log(blue(`✓ Loaded slash command: ${commandName} from ${relativePath}`));
  } else if (collection.get(commandName).hash !== hash) {
    collection.set(commandName, { command, hash });
    console.log(yellow(`↻ Refreshed slash command: ${commandName} from ${relativePath}`));
  }
}

/**
 * Validates and loads a prefix command.
 * @param {Object} command - The command module
 * @param {string} fullPath - Full path to the command file
 * @param {Map} collection - Collection to store commands
 */
function validateAndLoadPrefixCommand(command, fullPath, collection) {
  if (!command.name || !command.execute) {
    throw new CommandLoadError("Invalid prefix command structure: missing required properties");
  }

  const key = command.name.toLowerCase();
  if (!collection.has(key)) {
    collection.set(key, command);
    console.log(green(`✓ Loaded prefix command: ${command.name} from ${path.relative(process.cwd(), fullPath)}`));
  }
}

module.exports = loadCommands;
