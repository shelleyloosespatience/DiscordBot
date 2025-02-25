const fs = require("fs").promises;
const path = require("path");
const { blue, green, red, yellow } = require("colorette");
const logger = require("../utils/logger");
const config = require("../config");

class CommandLoadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "CommandLoadError";
    this.cause = cause;
  }
}

async function loadCommands(client) {
  try {
    // Initialize command collections on the client
    client.slashCommands = new Map();
    client.prefixCommands = new Map();

    const slashDir = path.join(__dirname, "..", "commands", "slash");
    const prefixDir = path.join(__dirname, "..", "commands", "prefix");

    // Load commands with enhanced error handling
    await Promise.all([
      loadDirectory(slashDir, client.slashCommands, true),
      loadDirectory(prefixDir, client.prefixCommands, false)
    ]);

    logger.info(`${blue("[INFO]")} Loaded ${green(client.slashCommands.size)} slash commands`);
    logger.info(`${blue("[INFO]")} Loaded ${green(client.prefixCommands.size)} prefix commands`);

    // Update Discord's command registry
    try {
      if (!client.application) {
        throw new Error("Client application not ready. Make sure to call this after client is ready.");
      }

      const commandsArray = [];
      for (const [name, cmd] of client.slashCommands) {
        try {
          if (!cmd.data || typeof cmd.data.toJSON !== "function") {
            logger.error(`${red("[ERROR]")} Invalid command data for ${name}`);
            continue;
          }
          commandsArray.push(cmd.data.toJSON());
        } catch (error) {
          logger.error(`${red("[ERROR]")} Error processing command ${name}:`, error);
        }
      }

      if (config.testGuild) {
        const guild = await client.guilds.fetch(config.testGuild);
        if (guild) {
          await guild.commands.set(commandsArray);
          logger.info(`${blue("[INFO]")} Successfully registered ${green(commandsArray.length)} slash commands in test guild: ${yellow(guild.name)}`);
        }
      } else {
        await client.application.commands.set(commandsArray);
        logger.info(`${blue("[INFO]")} Successfully registered ${green(commandsArray.length)} global slash commands`);
      }
    } catch (error) {
      logger.error(`${red("[ERROR]")} Failed to register commands with Discord API:`, error);
      throw new CommandLoadError("Failed to register Discord application commands", error);
    }
  } catch (error) {
    logger.error(`${red("[ERROR]")} Critical error in command loading:`, error);
    throw error;
  }
}

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

          delete require.cache[require.resolve(fullPath)];
          const command = require(fullPath);

          if (isSlash) {
            if (!command.data || typeof command.execute !== "function") {
              logger.error(`${red("[ERROR]")} Invalid slash command structure in ${fullPath}`);
              return;
            }
            collection.set(command.data.name, command);
            logger.info(`${blue("[INFO]")} Loaded slash command: ${command.data.name} from ${path.relative(process.cwd(), fullPath)}`);
          } else {
            if (!command.name || typeof command.execute !== "function") {
              logger.error(`${red("[ERROR]")} Invalid prefix command structure in ${fullPath}`);
              return;
            }
            collection.set(command.name.toLowerCase(), command);
            logger.info(`${blue("[INFO]")} Loaded prefix command: ${command.name} from ${path.relative(process.cwd(), fullPath)}`);
          }
        } catch (error) {
          logger.error(`${red("[ERROR]")} Failed to load command from ${path.relative(process.cwd(), fullPath)}:`, error);
        }
      })
    );
  } catch (error) {
    throw new CommandLoadError(`Failed to read directory: ${directory}`, error);
  }
}

module.exports = loadCommands;