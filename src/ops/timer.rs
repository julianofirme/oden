use deno_core::op2;
use deno_core::error::AnyError;
use tokio::time::{sleep, Duration};

#[op2(async)]
#[bigint]
pub async fn op_set_timeout(#[bigint] delay: u64) -> Result<(), AnyError> {
    sleep(Duration::from_millis(delay)).await;
    Ok(())
}