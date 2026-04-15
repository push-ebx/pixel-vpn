use serde::{Deserialize, Serialize};
use crate::server::ServerConfig;
use crate::settings::RoutingMode;

pub const SOCKS_INBOUND_PORT: u16 = 10808;
pub const HTTP_INBOUND_PORT: u16 = 10809;
pub const TUN_INTERFACE_NAME: &str = "Xray Tunnel";

// ─── Xray JSON config structures ────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct XrayConfig {
    pub log: LogConfig,
    pub inbounds: Vec<Inbound>,
    pub outbounds: Vec<Outbound>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub routing: Option<RoutingConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogConfig {
    pub loglevel: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Inbound {
    pub tag: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub listen: Option<String>,
    pub protocol: String,
    pub settings: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sniffing: Option<SniffingConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SniffingConfig {
    pub enabled: bool,
    #[serde(rename = "destOverride")]
    pub dest_override: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Outbound {
    pub tag: String,
    pub protocol: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub settings: Option<serde_json::Value>,
    #[serde(rename = "streamSettings")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream_settings: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoutingConfig {
    #[serde(rename = "domainStrategy")]
    pub domain_strategy: String,
    pub rules: Vec<RoutingRule>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoutingRule {
    #[serde(rename = "type")]
    pub rule_type: String,
    #[serde(rename = "inboundTag")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inbound_tag: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip: Option<Vec<String>>,
    #[serde(rename = "outboundTag")]
    pub outbound_tag: String,
}

// ─── Config builder ─────────────────────────────────────────────────

impl XrayConfig {
    pub fn build(
        server: &ServerConfig,
        routing_mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
        geodata_available: bool,
    ) -> Self {
        let proxy_outbound = Self::build_vless_outbound(server);

        let routing = Self::build_routing(routing_mode, bypass_domains, bypass_ips, geodata_available);

        Self {
            log: LogConfig {
                loglevel: "warning".to_string(),
            },
            inbounds: vec![
                Inbound {
                    tag: "tun-in".to_string(),
                    port: None,
                    listen: None,
                    protocol: "tun".to_string(),
                    // macOS requires utunN naming; let Xray auto-pick utun* by omitting name.
                    // Other platforms can use a friendly interface name.
                    settings: {
                        #[cfg(target_os = "macos")]
                        {
                            serde_json::json!({
                                "mtu": 1500,
                                "userLevel": 0
                            })
                        }
                        #[cfg(not(target_os = "macos"))]
                        {
                            serde_json::json!({
                                "name": TUN_INTERFACE_NAME,
                                "mtu": 1500,
                                "userLevel": 0
                            })
                        }
                    },
                    sniffing: None,
                },
                Inbound {
                    tag: "socks-in".to_string(),
                    port: Some(SOCKS_INBOUND_PORT),
                    listen: Some("127.0.0.1".to_string()),
                    protocol: "socks".to_string(),
                    settings: serde_json::json!({
                        "auth": "noauth",
                        "udp": true
                    }),
                    sniffing: Some(SniffingConfig {
                        enabled: true,
                        dest_override: vec![
                            "http".to_string(),
                            "tls".to_string(),
                            "quic".to_string(),
                        ],
                    }),
                },
                Inbound {
                    tag: "http-in".to_string(),
                    port: Some(HTTP_INBOUND_PORT),
                    listen: Some("127.0.0.1".to_string()),
                    protocol: "http".to_string(),
                    settings: serde_json::json!({}),
                    sniffing: None,
                },
            ],
            outbounds: vec![
                proxy_outbound,
                Outbound {
                    tag: "direct".to_string(),
                    protocol: "freedom".to_string(),
                    settings: None,
                    stream_settings: None,
                },
                Outbound {
                    tag: "block".to_string(),
                    protocol: "blackhole".to_string(),
                    settings: None,
                    stream_settings: None,
                },
            ],
            routing: Some(routing),
        }
    }

    #[cfg(not(target_os = "android"))]
    pub fn build_proxy_only(
        server: &ServerConfig,
        routing_mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
        geodata_available: bool,
    ) -> Self {
        let proxy_outbound = Self::build_vless_outbound(server);
        let routing = Self::build_routing(routing_mode, bypass_domains, bypass_ips, geodata_available);

        Self {
            log: LogConfig {
                loglevel: "warning".to_string(),
            },
            inbounds: vec![
                Inbound {
                    tag: "socks-in".to_string(),
                    port: Some(SOCKS_INBOUND_PORT),
                    listen: Some("127.0.0.1".to_string()),
                    protocol: "socks".to_string(),
                    settings: serde_json::json!({
                        "auth": "noauth",
                        "udp": true
                    }),
                    sniffing: Some(SniffingConfig {
                        enabled: true,
                        dest_override: vec![
                            "http".to_string(),
                            "tls".to_string(),
                            "quic".to_string(),
                        ],
                    }),
                },
                Inbound {
                    tag: "http-in".to_string(),
                    port: Some(HTTP_INBOUND_PORT),
                    listen: Some("127.0.0.1".to_string()),
                    protocol: "http".to_string(),
                    settings: serde_json::json!({}),
                    sniffing: None,
                },
            ],
            outbounds: vec![
                proxy_outbound,
                Outbound {
                    tag: "direct".to_string(),
                    protocol: "freedom".to_string(),
                    settings: None,
                    stream_settings: None,
                },
                Outbound {
                    tag: "block".to_string(),
                    protocol: "blackhole".to_string(),
                    settings: None,
                    stream_settings: None,
                },
            ],
            routing: Some(routing),
        }
    }

    /// Android variant: no TUN inbound (VpnService provides TUN externally),
    /// only SOCKS inbound for libXray to proxy through.
    #[cfg(target_os = "android")]
    pub fn build_for_android(
        server: &ServerConfig,
        routing_mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
    ) -> Self {
        let proxy_outbound = Self::build_vless_outbound(server);
        let routing = Self::build_routing(routing_mode, bypass_domains, bypass_ips, true);

        Self {
            log: LogConfig {
                loglevel: "warning".to_string(),
            },
            inbounds: vec![
                Inbound {
                    tag: "socks".to_string(),
                    port: Some(SOCKS_INBOUND_PORT),
                    listen: Some("127.0.0.1".to_string()),
                    protocol: "socks".to_string(),
                    settings: serde_json::json!({
                        "auth": "noauth",
                        "udp": true
                    }),
                    sniffing: Some(SniffingConfig {
                        enabled: true,
                        dest_override: vec![
                            "http".to_string(),
                            "tls".to_string(),
                            "quic".to_string(),
                        ],
                    }),
                },
                Inbound {
                    tag: "tun".to_string(),
                    port: None,
                    listen: None,
                    protocol: "tun".to_string(),
                    settings: serde_json::json!({
                        "name": "xray0",
                        "mtu": [1500],
                        "userLevel": 0
                    }),
                    sniffing: Some(SniffingConfig {
                        enabled: true,
                        dest_override: vec![
                            "http".to_string(),
                            "tls".to_string(),
                            "quic".to_string(),
                        ],
                    }),
                },
            ],
            outbounds: vec![
                proxy_outbound,
                Outbound {
                    tag: "direct".to_string(),
                    protocol: "freedom".to_string(),
                    settings: None,
                    stream_settings: None,
                },
                Outbound {
                    tag: "block".to_string(),
                    protocol: "blackhole".to_string(),
                    settings: None,
                    stream_settings: None,
                },
            ],
            routing: Some(routing),
        }
    }

    fn build_vless_outbound(server: &ServerConfig) -> Outbound {
        let mut stream = serde_json::json!({
            "network": server.network.as_deref().unwrap_or("tcp"),
        });

        // Security / TLS settings
        match server.security.as_deref() {
            Some("reality") => {
                stream["security"] = serde_json::json!("reality");
                stream["realitySettings"] = serde_json::json!({
                    "serverName": server.sni.as_deref().unwrap_or("www.google.com"),
                    "fingerprint": server.fingerprint.as_deref().unwrap_or("chrome"),
                    "publicKey": server.public_key.as_deref().unwrap_or(""),
                    "shortId": server.short_id.as_deref().unwrap_or(""),
                });
            }
            Some("tls") => {
                stream["security"] = serde_json::json!("tls");
                stream["tlsSettings"] = serde_json::json!({
                    "serverName": server.sni.as_deref().unwrap_or(&server.address),
                    "fingerprint": server.fingerprint.as_deref().unwrap_or("chrome"),
                    "allowInsecure": false,
                });
            }
            _ => {}
        }

        // WebSocket settings
        if server.network.as_deref() == Some("ws") {
            stream["wsSettings"] = serde_json::json!({
                "path": server.path.as_deref().unwrap_or("/"),
                "headers": {
                    "Host": server.host.as_deref().unwrap_or(&server.address)
                }
            });
        }

        // gRPC settings
        if server.network.as_deref() == Some("grpc") {
            stream["grpcSettings"] = serde_json::json!({
                "serviceName": server.path.as_deref().unwrap_or(""),
            });
        }

        Outbound {
            tag: "proxy".to_string(),
            protocol: "vless".to_string(),
            settings: Some(serde_json::json!({
                "vnext": [{
                    "address": server.address,
                    "port": server.port,
                    "users": [{
                        "id": server.uuid,
                        "encryption": "none",
                        "flow": server.flow.as_deref().unwrap_or("")
                    }]
                }]
            })),
            stream_settings: Some(stream),
        }
    }

    fn build_routing(
        mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
        geodata_available: bool,
    ) -> RoutingConfig {
        let mut rules = Vec::new();

        // Always bypass private/local networks
        rules.push(RoutingRule {
            rule_type: "field".to_string(),
            inbound_tag: None,
            port: None,
            domain: None,
            ip: Some(if geodata_available {
                vec!["geoip:private".to_string()]
            } else {
                vec![
                    "10.0.0.0/8".to_string(),
                    "172.16.0.0/12".to_string(),
                    "192.168.0.0/16".to_string(),
                    "127.0.0.0/8".to_string(),
                    "::1/128".to_string(),
                    "fc00::/7".to_string(),
                    "fe80::/10".to_string(),
                ]
            }),
            outbound_tag: "direct".to_string(),
        });

        // Block ads only when geosite data is available.
        if geodata_available {
            rules.push(RoutingRule {
                rule_type: "field".to_string(),
                inbound_tag: None,
                port: None,
                domain: Some(vec!["geosite:category-ads-all".to_string()]),
                ip: None,
                outbound_tag: "block".to_string(),
            });
        }

        match mode {
            RoutingMode::Global => {
                // All traffic through proxy (except private & bypass lists)
            }
            RoutingMode::BypassRussia => {
                // RU bypass rules require geosite/geoip data files.
                if geodata_available {
                    rules.push(RoutingRule {
                        rule_type: "field".to_string(),
                        inbound_tag: None,
                        port: None,
                        domain: Some(vec!["geosite:category-ru".to_string()]),
                        ip: None,
                        outbound_tag: "direct".to_string(),
                    });
                    rules.push(RoutingRule {
                        rule_type: "field".to_string(),
                        inbound_tag: None,
                        port: None,
                        domain: None,
                        ip: Some(vec!["geoip:ru".to_string()]),
                        outbound_tag: "direct".to_string(),
                    });
                }
            }
            RoutingMode::BypassCN => {
                if geodata_available {
                    rules.push(RoutingRule {
                        rule_type: "field".to_string(),
                        inbound_tag: None,
                        port: None,
                        domain: Some(vec!["geosite:cn".to_string()]),
                        ip: None,
                        outbound_tag: "direct".to_string(),
                    });
                    rules.push(RoutingRule {
                        rule_type: "field".to_string(),
                        inbound_tag: None,
                        port: None,
                        domain: None,
                        ip: Some(vec!["geoip:cn".to_string()]),
                        outbound_tag: "direct".to_string(),
                    });
                }
            }
            RoutingMode::BypassCustom => {
                // Only custom bypass lists below
            }
        }

        // Custom bypass domains
        if !bypass_domains.is_empty() {
            rules.push(RoutingRule {
                rule_type: "field".to_string(),
                inbound_tag: None,
                port: None,
                domain: Some(bypass_domains.to_vec()),
                ip: None,
                outbound_tag: "direct".to_string(),
            });
        }

        // Custom bypass IPs
        if !bypass_ips.is_empty() {
            rules.push(RoutingRule {
                rule_type: "field".to_string(),
                inbound_tag: None,
                port: None,
                domain: None,
                ip: Some(bypass_ips.to_vec()),
                outbound_tag: "direct".to_string(),
            });
        }

        #[cfg(target_os = "android")]
        let capture_inbounds = vec!["tun".to_string(), "socks".to_string()];
        #[cfg(not(target_os = "android"))]
        let capture_inbounds = vec![
            "tun-in".to_string(),
            "socks-in".to_string(),
            "http-in".to_string(),
        ];

        // Android TUN path sends DNS as UDP packets; keep DNS direct to avoid
        // resolver stalls when upstream proxy does not relay UDP reliably.
        #[cfg(target_os = "android")]
        rules.push(RoutingRule {
            rule_type: "field".to_string(),
            inbound_tag: Some(capture_inbounds.clone()),
            port: Some("53".to_string()),
            domain: None,
            ip: None,
            outbound_tag: "direct".to_string(),
        });

        // Force full tunnel for traffic captured by our inbounds.
        rules.push(RoutingRule {
            rule_type: "field".to_string(),
            inbound_tag: Some(capture_inbounds),
            port: None,
            domain: None,
            ip: None,
            outbound_tag: "proxy".to_string(),
        });

        RoutingConfig {
            domain_strategy: "IPIfNonMatch".to_string(),
            rules,
        }
    }
}
