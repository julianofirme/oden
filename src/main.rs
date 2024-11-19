use deno_core::error::AnyError;
use deno_core::extension;
use std::env;
use std::rc::Rc;

mod ops;
use ops::fs_events::{op_delete_file, op_read_file, op_write_file};
use ops::timer::op_set_timeout;
use ops::http::{op_create_http_server, op_on_http_request};

mod ts;
use ts::loader;

extension!(
  oden,
  ops = [
    op_write_file, 
    op_delete_file, 
    op_read_file,
    op_set_timeout,
    op_create_http_server,
    op_on_http_request
  ],
  esm_entry_point = "ext:oden/runtime.js",
  esm = [dir "src", "runtime.js"],
);

async fn run_js(file_path: &str) -> Result<(), AnyError> {
    let main_module = deno_core::resolve_path(file_path, &std::env::current_dir()?)?;
    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(Rc::new(loader::TsModuleLoader)),
        extensions: vec![oden::init_ops_and_esm()],
        ..Default::default()
    });

    let mod_id = js_runtime.load_main_es_module(&main_module).await?;
    let result = js_runtime.mod_evaluate(mod_id);
    js_runtime.run_event_loop(Default::default()).await?;
    result.await
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    if let Err(error) = runtime.block_on(run_js(&args[1])) {
        eprintln!("error: {}", error);
    }
}
