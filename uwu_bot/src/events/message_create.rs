use serenity::model::channel::Message;
use serenity::prelude::*;
use std::collections::HashMap;

pub async fn run(ctx: Context, msg: Message) -> serenity::Result<()> {
    if msg.author.bot {
        return Ok(()); // Ignore bot messages
    }

    let prefix = "dick"; // Change this to your bot's prefix

    if msg.content.starts_with(prefix) {
        let args: Vec<&str> = msg.content[prefix.len()..].split_whitespace().collect();
        if args.is_empty() {
            return Ok(());
        }

        let command_name = args[0];

        // Check if the command exists and call it
        match command_name {
            "ping" => {
                crate::prefix_ping::run(ctx, msg).await?;
            }
            "help" => {
                crate::prefix_help::run(ctx, msg).await?;
            }
            _ => {
                msg.channel_id.say(&ctx.http, "Unknown command!").await?;
            }
        }
    }

    Ok(())
}
