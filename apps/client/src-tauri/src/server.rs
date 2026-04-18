use serde::{Deserialize, Serialize};
use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerConfig {
    pub id: String,
    pub name: String,
    pub address: String,
    pub port: u16,
    pub uuid: String,
    // Optional VLESS params
    pub security: Option<String>,   // "reality", "tls", "none"
    pub network: Option<String>,    // "tcp", "ws", "grpc"
    pub flow: Option<String>,       // "xtls-rprx-vision"
    pub sni: Option<String>,
    pub fingerprint: Option<String>,
    pub public_key: Option<String>, // Reality
    pub short_id: Option<String>,   // Reality
    pub path: Option<String>,       // WS/gRPC path
    pub host: Option<String>,       // WS host header
    // Runtime state (not persisted in config)
    #[serde(default)]
    pub latency_ms: Option<u32>,
}

impl ServerConfig {
    const LATENCY_SERVICES: [(&'static str, u16); 5] = [
        ("speed.cloudflare.com", 443),
        ("www.cloudflare.com", 443),
        ("www.google.com", 443),
        ("www.microsoft.com", 443),
        ("www.apple.com", 443),
    ];

    /// Parse a vless:// URI into a ServerConfig
    /// Format: vless://UUID@HOST:PORT?params#NAME
    pub fn from_vless_uri(uri: &str) -> Result<Self, String> {
        let uri = uri.trim();
        if !uri.starts_with("vless://") {
            return Err("Некорректный VLESS URI".to_string());
        }

        let without_scheme = &uri[8..];

        // Split fragment (#name)
        let (main, fragment) = match without_scheme.rfind('#') {
            Some(i) => (&without_scheme[..i], Self::url_decode(&without_scheme[i + 1..])),
            None => (without_scheme, String::new()),
        };

        // Split uuid@host:port?params
        let (user_host, query) = match main.find('?') {
            Some(i) => (&main[..i], &main[i + 1..]),
            None => (main, ""),
        };

        // uuid@host:port
        let at_pos = user_host
            .find('@')
            .ok_or("В VLESS URI отсутствует символ @")?;
        let uuid = user_host[..at_pos].to_string();
        let host_port = &user_host[at_pos + 1..];

        // Handle IPv6: [::1]:443
        let (address, port) = if host_port.starts_with('[') {
            let bracket_end = host_port
                .find(']')
                .ok_or("Некорректный IPv6-адрес")?;
            let addr = host_port[1..bracket_end].to_string();
            let port_str = &host_port[bracket_end + 2..]; // skip ]:
            let port: u16 = port_str.parse().map_err(|_| "Некорректный порт")?;
            (addr, port)
        } else {
            let colon = host_port
                .rfind(':')
                .ok_or("В VLESS URI отсутствует порт")?;
            let addr = host_port[..colon].to_string();
            let port: u16 = host_port[colon + 1..]
                .parse()
                .map_err(|_| "Некорректный порт")?;
            (addr, port)
        };

        // Parse query params
        let params = Self::parse_query(query);

        let name = if fragment.is_empty() {
            format!("{}:{}", address, port)
        } else {
            fragment
        };

        let id = format!("{:x}", md5_simple(&format!("{}:{}:{}", uuid, address, port)));

        Ok(Self {
            id,
            name,
            address,
            port,
            uuid,
            security: params.get("security").cloned(),
            network: params.get("type").cloned(),
            flow: params.get("flow").cloned(),
            sni: params.get("sni").cloned(),
            fingerprint: params.get("fp").cloned(),
            public_key: params.get("pbk").cloned(),
            short_id: params.get("sid").cloned(),
            path: params.get("path").cloned(),
            host: params.get("host").cloned(),
            latency_ms: None,
        })
    }

    fn parse_query(query: &str) -> std::collections::HashMap<String, String> {
        let mut map = std::collections::HashMap::new();
        if query.is_empty() {
            return map;
        }
        for pair in query.split('&') {
            if let Some(eq) = pair.find('=') {
                let key = &pair[..eq];
                let value = Self::url_decode(&pair[eq + 1..]);
                map.insert(key.to_string(), value);
            }
        }
        map
    }

    fn url_decode(s: &str) -> String {
        let mut result = String::with_capacity(s.len());
        let mut chars = s.bytes();
        while let Some(b) = chars.next() {
            if b == b'%' {
                let hi = chars.next().unwrap_or(b'0');
                let lo = chars.next().unwrap_or(b'0');
                let hex = format!("{}{}", hi as char, lo as char);
                if let Ok(decoded) = u8::from_str_radix(&hex, 16) {
                    result.push(decoded as char);
                }
            } else if b == b'+' {
                result.push(' ');
            } else {
                result.push(b as char);
            }
        }
        result
    }

    /// Service-based latency probing: ping several public services and use median of best rounds.
    pub fn ping(&self) -> Option<u32> {
        let service_addrs = Self::collect_service_addrs();
        let mut samples = Vec::new();

        for _ in 0..4 {
            let mut round_best: Option<u32> = None;
            for addr in &service_addrs {
                if let Some(ms) = Self::probe_tcp_rtt(addr, Duration::from_millis(1500)) {
                    round_best = Some(round_best.map_or(ms, |best| best.min(ms)));
                }
            }

            if let Some(ms) = round_best {
                samples.push(ms);
            }

            thread::sleep(Duration::from_millis(120));
        }

        if !samples.is_empty() {
            samples.sort_unstable();
            return Some(samples[samples.len() / 2]);
        }

        self.probe_latency_server()
    }

    fn collect_service_addrs() -> Vec<SocketAddr> {
        let mut resolved = Vec::new();
        for (host, port) in Self::LATENCY_SERVICES {
            if let Ok(addrs) = (host, port).to_socket_addrs() {
                for addr in addrs {
                    resolved.push(addr);
                }
            }
        }
        resolved
    }

    fn probe_latency_server(&self) -> Option<u32> {
        let target = format!("{}:{}", self.address, self.port);
        let addrs = target.to_socket_addrs().ok()?.collect::<Vec<_>>();
        if addrs.is_empty() {
            return None;
        }

        addrs
            .into_iter()
            .find_map(|addr| Self::probe_tcp_rtt(&addr, Duration::from_secs(2)))
    }

    fn probe_tcp_rtt(addr: &SocketAddr, timeout: Duration) -> Option<u32> {
        let start = Instant::now();
        if TcpStream::connect_timeout(addr, timeout).is_ok() {
            Some(start.elapsed().as_millis() as u32)
        } else {
            None
        }
    }
}

/// Simple non-crypto hash for generating IDs (not a real md5, just a fast hash)
fn md5_simple(input: &str) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_vless_uri() {
        let uri = "vless://uuid-here@example.com:443?type=tcp&security=reality&fp=chrome&pbk=PUBKEY&sid=ab&sni=www.google.com&flow=xtls-rprx-vision#My%20Server";
        let server = ServerConfig::from_vless_uri(uri).unwrap();
        assert_eq!(server.uuid, "uuid-here");
        assert_eq!(server.address, "example.com");
        assert_eq!(server.port, 443);
        assert_eq!(server.name, "My Server");
        assert_eq!(server.security.as_deref(), Some("reality"));
        assert_eq!(server.network.as_deref(), Some("tcp"));
        assert_eq!(server.flow.as_deref(), Some("xtls-rprx-vision"));
        assert_eq!(server.public_key.as_deref(), Some("PUBKEY"));
    }
}
