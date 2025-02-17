use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::prelude::*;
use std::env;

mod events;
mod handlers;
mod commands;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        // Delegate message handling to the events module.
        if let Err(why) = events::message_create::run(ctx, msg).await {
            println!("Error in message event: {:?}", why);
        }
    }

    async fn ready(&self, ctx: Context, ready: Ready) {
        println!("{} is connected!", ready.user.name);
        if let Err(why) = events::ready::run(ctx, ready).await {
            println!("Error in ready event: {:?}", why);
        }
    }
}

#[tokio::main]
async fn main() {
    let token = env::var("DISCORD_TOKEN")
        .expect("Expected DISCORD_TOKEN in environment");

    let mut client = Client::builder(&token, GatewayIntents::all())
        .event_handler(Handler)
        .await
        .expect("Error creating client");

    // Load commands into the client's data store.
    {
        let mut data = client.data.write().await;
        if let Err(e) = handlers::load_commands::load_all_commands(&mut data) {
            println!("Error loading commands: {:?}", e);
        }
    }

    if let Err(why) = client.start().await {
        println!("Client error: {:?}", why);
    }
}