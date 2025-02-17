use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use serenity::prelude::*;
use crate::commands::Command;

pub struct CommandsKey;

impl TypeMapKey for CommandsKey {
    type Value = HashMap<String, Box<dyn Command + Send + Sync>>;
}

/// Recursively scans directories and loads commands
fn scan_command_directory(base_path: &Path) -> std::io::Result<Vec<PathBuf>> {
    let mut commands = Vec::new();
    
    if base_path.is_dir() {
        for entry in fs::read_dir(base_path)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                // Recursively scan subdirectories
                let mut subdir_commands = scan_command_directory(&path)?;
                commands.append(&mut subdir_commands);
            } else if path.extension().map_or(false, |ext| ext == "rs") {
                // Found a Rust source file
                commands.push(path);
            }
        }
    }
    
    Ok(commands)
}

/// Loads all commands from the prefix and slash directories
pub fn load_all_commands(data: &mut TypeMap) -> std::io::Result<()> {
    let mut commands: HashMap<String, Box<dyn Command + Send + Sync>> = HashMap::new();
    
    // Base paths for prefix and slash commands
    let prefix_path = Path::new("src/commands/prefix");
    let slash_path = Path::new("src/commands/slash");
    
    println!("[{}] Scanning for commands in prefix directory...", 
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"));
    
    // Scan prefix commands
    if prefix_path.exists() {
        for command_file in scan_command_directory(prefix_path)? {
            if let Some(file_name) = command_file.file_stem() {
                if let Some(name) = file_name.to_str() {
                    // Here you would typically use a macro or reflection to load the command
                    // For now, we'll just print that we found it
                    println!("[{}] Found prefix command: {}", 
                        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"), name);
                    
                    // In a real implementation, you would load the command module here
                    // commands.insert(name.to_string(), Box::new(loaded_command));
                }
            }
        }
    }
    
    println!("[{}] Scanning for commands in slash directory...", 
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"));
    
    // Scan slash commands
    if slash_path.exists() {
        for command_file in scan_command_directory(slash_path)? {
            if let Some(file_name) = command_file.file_stem() {
                if let Some(name) = file_name.to_str() {
                    println!("[{}] Found slash command: {}", 
                        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"), name);
                    
                    // Similar to prefix commands, you would load the module here
                }
            }
        }
    }
    
    // Store the commands in the TypeMap
    data.insert::<CommandsKey>(commands);
    
    println!("[{}] Command loading complete!", 
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"));
    
    Ok(())
}

// Helper function to handle loading errors
fn handle_load_error(path: &Path, error: std::io::Error) {
    println!("[{}] Error loading command from {:?}: {:?}", 
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"),
        path, error);
}