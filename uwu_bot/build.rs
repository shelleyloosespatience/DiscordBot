use std::{env, fs, path::Path};
use walkdir::WalkDir;

fn main() {
    // Where Cargo will let us write generated files
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated_commands.rs");

    let mut content = String::new();

    // We'll scan these two directories
    let dirs = ["src/commands/prefix", "src/commands/slash"];

    for dir in dirs {
        for entry in WalkDir::new(dir) {
            let entry = entry.unwrap();
            if entry.file_type().is_file() {
                let path = entry.path();
                // Only handle .rs files
                if path.extension().and_then(|e| e.to_str()) == Some("rs") {
                    // Get the full path as a string
                    let full_path = path.to_str().unwrap();

                    // Compute module name by stripping the prefix, replacing / and .rs,
                    // and then trimming any leading underscore.
                    let mod_name_temp = path
                        .strip_prefix("src/commands")
                        .unwrap()
                        .to_str()
                        .unwrap()
                        .replace("/", "_")
                        .replace(".rs", "");
                    let mod_name = mod_name_temp.trim_start_matches('_').to_string();

                    // Generate code like:
                    // #[path = "full_path"] mod mod_name;
                    // pub use mod_name::*;
                    content.push_str(&format!(
                        "#[path = \"{}\"] mod {};\n",
                        full_path, mod_name
                    ));
                    content.push_str(&format!("pub use {}::*;\n", mod_name));
                }
            }
        }
    }

    // Write out the generated code
    fs::write(&dest_path, content).unwrap();

    // Tell Cargo to rerun if these directories change
    println!("cargo:rerun-if-changed=src/commands/prefix");
    println!("cargo:rerun-if-changed=src/commands/slash");
}