use serenity::model::channel::Message;
use serenity::prelude::*;
use crate::commands::Command;

pub struct HelpCommand;

impl HelpCommand {
    pub fn new() -> Self {
        HelpCommand
    }
}

impl Command for HelpCommand {
    fn name(&self) -> &str {
        "help"
    }

    fn execute(&self, ctx: &Context, msg: &Message) {
        let _ = msg.channel_id.say(&ctx.http, "This is the help command.");
    }
}

/// Helper function for command registration.
pub fn create() -> Option<Box<dyn Command + Send + Sync>> {
    Some(Box::new(HelpCommand::new()))
}