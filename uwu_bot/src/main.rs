use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::prelude::*;
use std::env;

mod events;
mod handlers;
mod commands;

// A custom event handler structure that delegates events to modules.
struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        // Delegate to the message_create event in the events folder.
        // You should implement a function `run` in src/events/message_create.rs
        if let Err(why) = events::message_create::run(ctx, msg).await {
            println!("Error in message event: {:?}", why);
        }
    }

    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
        // Delegate to the ready event in the events folder.
        if let Err(why) = events::ready::run(ctx, ready).await {
            println!("Error in ready event: {:?}", why);
        }
    }
}

#[tokio::main]
async fn main() {
    // You can set your bot token in an environment variable "DISCORD_TOKEN"
    let token = env::var("DISCORD_TOKEN")
        .expect("Expected a token in the environment");

    // Create a Discord client with all gateway intents enabled.
    let mut client = Client::builder(&token, GatewayIntents::all())
        .event_handler(Handler)
        .await
        .expect("Error creating client");

    // Load commands into the client's data store.
    {
        let mut data = client.data.write().await;
        handlers::load_commands::load_commands(&mut data);
    }

    // Start the client, connecting to Discord.
    if let Err(why) = client.start().await {
        println!("Client error: {:?}", why);
    }
}