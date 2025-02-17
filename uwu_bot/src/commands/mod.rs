pub mod prefix;
pub mod slash;

// Include auto-generated command modules from build.rs.
// This file is regenerated in build time and will include lines such as:
// #[path = "src/commands/prefix/ping.rs"] mod prefix_ping;
// pub use prefix_ping::*;
include!(concat!(env!("OUT_DIR"), "/generated_commands.rs"));

pub trait Command: Send + Sync {
    fn name(&self) -> &str;
    fn execute(&self, ctx: &serenity::prelude::Context, msg: &serenity::model::channel::Message);
}