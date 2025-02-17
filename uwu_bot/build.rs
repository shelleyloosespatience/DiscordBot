// build.rs
use std::{env, fs, path::Path};
use walkdir::WalkDir;

fn main() {
    // Where Cargo will let us write generated files
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated_commands.rs");

    let mut content = String::new();

    // We’ll scan these two directories
    let dirs = ["src/commands/prefix", "src/commands/slash"];

    for dir in dirs {
        for entry in WalkDir::new(dir) {
            let entry = entry.unwrap();
            if entry.file_type().is_file() {
                let path = entry.path();
                // Only handle .rs files
                if path.extension().and_then(|e| e.to_str()) == Some("rs") {
                    // Example: "src/commands/prefix/ping.rs"
                    // Strip "src/commands" -> "prefix/ping.rs"
                    let rel_path = path.strip_prefix("src/commands").unwrap().to_str().unwrap();

                    // Turn that into a valid module name: "prefix_ping"
                    let mod_name = rel_path
                        .replace("/", "_")
                        .replace(".rs", "");

                    // Generate code like:
                    // #[path = "src/commands/prefix/ping.rs"] mod prefix_ping;
                    // pub use prefix_ping::*;
                    content.push_str(&format!(
                        "#[path = \"src/commands/{}\"] mod {};\n",
                        rel_path, mod_name
                    ));
                    content.push_str(&format!("pub use {}::*;\n", mod_name));
                }
            }
        }
    }

    // Write out the generated code, why life so hard here, js got simple require() statements :sob:
    fs::write(&dest_path, content).unwrap();

    // Tell Cargo to rerun if these dirs change
    println!("cargo:rerun-if-changed=src/commands/prefix");
    println!("cargo:rerun-if-changed=src/commands/slash");
}
