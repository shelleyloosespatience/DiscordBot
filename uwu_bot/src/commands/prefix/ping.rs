// src/commands/prefix/ping.rs
use crate::command::{Command, CommandRegistration};

pub struct PingCommand;

impl Command for PingCommand {
    fn name(&self) -> &'static str {
        "ping"
    }
    fn execute(&self) {
        println!("Pong!");
    }
}

fn create_ping() -> Box<dyn Command + Send + Sync> {
    Box::new(PingCommand)
}
inventory::submit! {
    CommandRegistration {
        create: create_ping,
    }
}
