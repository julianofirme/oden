use std::{collections::HashMap, hash::Hash};

use deno_core::{anyhow, error::AnyError, op2};
use tokio::io::{AsyncBufRead, AsyncBufReadExt};
use tokio::{io::BufStream, net::TcpListener};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct Request {
    pub method: Method,
    pub path: String,
    pub headers: HashMap<String, String>,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
pub enum Method {
    Get,
}

impl TryFrom<&str> for Method {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "GET" => Ok(Method::Get),
            m => Err(anyhow::anyhow!("unsupported method: {m}")),
        }
    }
}

async fn parse_request(mut stream: impl AsyncBufRead + Unpin) -> anyhow::Result<Request> {
    let mut line_buffer = String::new();
    stream.read_line(&mut line_buffer).await?;

    let mut parts = line_buffer.split_whitespace();

    let method: Method = parts
        .next()
        .ok_or(anyhow::anyhow!("missing method"))
        .and_then(TryInto::try_into)?;

    let path: String = parts
        .next()
        .ok_or(anyhow::anyhow!("missing path"))
        .map(Into::into)?;

    let mut headers = HashMap::new();

    loop {
        line_buffer.clear();
        stream.read_line(&mut line_buffer).await?;

        if line_buffer.is_empty() || line_buffer == "\n" || line_buffer == "\r\n" {
            break;
        }

        let mut comps = line_buffer.split(":");
        let key = comps.next().ok_or(anyhow::anyhow!("missing header name"))?;
        let value = comps
            .next()
            .ok_or(anyhow::anyhow!("missing header value"))?
            .trim();

        headers.insert(key.to_string(), value.to_string());
    }

    Ok(Request {
        method,
        path,
        headers,
    })
}

#[op2(async)]
#[string]
pub async fn op_create_http_server(#[string] port: String) -> Result<(), AnyError> {
    let parsed_port: u16 = port.to_string().parse()?;

    let listener = TcpListener::bind(format!("0.0.0.0:{parsed_port}")).await.unwrap();

    loop {
        let (stream, _) = listener.accept().await?;
        BufStream::new(stream);
    }
}

#[op2(async)]
#[bigint]
pub async fn op_on_http_request(#[bigint] port: u64) -> Result<(), AnyError> {
    Ok(())
}
