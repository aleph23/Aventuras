// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Workaround for "Failed to create GBM buffer" on Linux (e.g. Wayland/NVIDIA).
    // This disables the DMA-BUF renderer, forcing a more compatible fallback.
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    aventura_lib::run()
}
