import Foundation
import NetworkExtension
import os.log

class PacketTunnelProvider: NEPacketTunnelProvider {

    private let log = OSLog(subsystem: "com.pixelvpn.tunnel", category: "PacketTunnel")
    private var xrayProcess: Process?
    private var xrayConfigPath: String?

    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        os_log("Starting packet tunnel", log: log, type: .info)

        guard let providerConfig = protocolConfiguration as? NETunnelProviderProtocol,
              let config = providerConfig.providerConfiguration else {
            os_log("Missing provider configuration", log: log, type: .error)
            completionHandler(PacketTunnelError.missingConfiguration)
            return
        }

        guard let xrayConfigBase64 = config["xrayConfigBase64"] as? String,
              let xrayBinaryPath = config["xrayBinaryPath"] as? String else {
            os_log("Missing xray configuration", log: log, type: .error)
            completionHandler(PacketTunnelError.missingConfiguration)
            return
        }

        guard let configData = Data(base64Encoded: xrayConfigBase64),
              let configString = String(data: configData, encoding: .utf8) else {
            os_log("Failed to decode xray config", log: log, type: .error)
            completionHandler(PacketTunnelError.invalidConfiguration)
            return
        }

        let tempDir = FileManager.default.temporaryDirectory
        let configPath = tempDir.appendingPathComponent("pixel-vpn-xray-config.json")

        do {
            try configString.write(to: configPath, atomically: true, encoding: .utf8)
            xrayConfigPath = configPath.path
        } catch {
            os_log("Failed to write xray config: %{public}@", log: log, type: .error, error.localizedDescription)
            completionHandler(error)
            return
        }

        startXray(binaryPath: xrayBinaryPath, configPath: configPath.path) { [weak self] error in
            if let error = error {
                os_log("Failed to start xray: %{public}@", log: self?.log ?? .default, type: .error, error.localizedDescription)
                completionHandler(error)
                return
            }

            self?.configureTunnelNetworkSettings { settingsError in
                completionHandler(settingsError)
            }
        }
    }

    private func startXray(binaryPath: String, configPath: String, completion: @escaping (Error?) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: binaryPath)
            process.arguments = ["run", "-config", configPath]

            let outputPipe = Pipe()
            let errorPipe = Pipe()
            process.standardOutput = outputPipe
            process.standardError = errorPipe

            do {
                try process.run()
                self?.xrayProcess = process

                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    if process.isRunning {
                        os_log("xray started successfully", log: self?.log ?? .default, type: .info)
                        completion(nil)
                    } else {
                        let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
                        let errorOutput = String(data: errorData, encoding: .utf8) ?? "Unknown error"
                        os_log("xray exited immediately: %{public}@", log: self?.log ?? .default, type: .error, errorOutput)
                        completion(PacketTunnelError.xrayFailedToStart(errorOutput))
                    }
                }
            } catch {
                os_log("Failed to start xray process: %{public}@", log: self?.log ?? .default, type: .error, error.localizedDescription)
                completion(error)
            }
        }
    }

    private func configureTunnelNetworkSettings(completion: @escaping (Error?) -> Void) {
        let tunnelAddress = "10.8.0.2"
        let tunnelNetmask = "255.255.255.0"
        let dnsServers = ["8.8.8.8", "8.8.4.4"]
        let includedRoutes = [NEIPv4Route.default()]

        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: tunnelAddress)

        let ipv4Settings = NEIPv4Settings(addresses: [tunnelAddress], subnetMasks: [tunnelNetmask])
        ipv4Settings.includedRoutes = includedRoutes
        ipv4Settings.excludedRoutes = []
        settings.ipv4Settings = ipv4Settings

        let dnsSettings = NEDNSSettings(servers: dnsServers)
        settings.dnsSettings = dnsSettings

        settings.mtu = 1500

        setTunnelNetworkSettings(settings) { error in
            if let error = error {
                os_log("Failed to set tunnel network settings: %{public}@", log: self.log, type: .error, error.localizedDescription)
            } else {
                os_log("Tunnel network settings configured", log: self.log, type: .info)
            }
            completion(error)
        }
    }

    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        os_log("Stopping packet tunnel, reason: %{public}d", log: log, type: .info, reason.rawValue)

        if let process = xrayProcess, process.isRunning {
            process.terminate()
        }
        xrayProcess = nil

        completionHandler()
    }

    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        if let message = String(data: messageData, encoding: .utf8) {
            os_log("Received app message: %{public}@", log: log, type: .debug, message)

            if message == "status" {
                let status = xrayProcess?.isRunning == true ? "running" : "stopped"
                let response = status.data(using: .utf8)
                completionHandler?(response)
                return
            }
        }
        completionHandler?(nil)
    }

    override func sleep(completionHandler: @escaping () -> Void) {
        os_log("Tunnel going to sleep", log: log, type: .info)
        completionHandler()
    }

    override func wake() {
        os_log("Tunnel waking up", log: log, type: .info)
    }
}

enum PacketTunnelError: Error, LocalizedError {
    case missingConfiguration
    case invalidConfiguration
    case xrayFailedToStart(String)

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            return "Missing tunnel configuration"
        case .invalidConfiguration:
            return "Invalid tunnel configuration"
        case .xrayFailedToStart(let reason):
            return "Xray failed to start: \(reason)"
        }
    }
}
