use serenity::model::gateway::Ready;
use serenity::prelude::*;

pub async fn run(_ctx: Context, ready: Ready) -> Result<(), Box<dyn std::error::Error>> {
    println!("Ready event: Logged in as {}.", ready.user.name);
    Ok(())
}