use deno_core::op2;
use deno_core::error::AnyError;
use tokio::fs;

#[op2(async)]
#[string]
pub async fn op_write_file(#[string] path: String, #[string] contents: String) -> Result<(), AnyError> {
    fs::write(path, contents).await?;
    Ok(())
}

#[op2(async)]
#[string]
pub async fn op_read_file(#[string] path: String) -> Result<String, AnyError> {
    let contents = fs::read_to_string(path).await?;
    Ok(contents)
}

#[op2(async)]
#[string]
pub async fn op_delete_file(#[string] path: String) -> Result<(), AnyError> {
    fs::remove_file(path).await?;
    Ok(())
}
