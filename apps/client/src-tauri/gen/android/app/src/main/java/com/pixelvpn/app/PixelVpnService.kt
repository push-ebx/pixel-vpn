package com.pixelvpn.app

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import XrayCore.XrayCore

class PixelVpnService : VpnService() {

    companion object {
        private const val TAG = "PixelVpnService"
        const val ACTION_START = "com.pixelvpn.app.START_VPN"
        const val ACTION_STOP = "com.pixelvpn.app.STOP_VPN"
        const val EXTRA_CONFIG = "config_json"

        var isRunning = false
            private set
    }

    private var tunFd: ParcelFileDescriptor? = null

    override fun onCreate() {
        super.onCreate()
        VpnNotification.createChannel(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopVpn()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                val configJson = intent.getStringExtra(EXTRA_CONFIG)
                if (configJson.isNullOrEmpty()) {
                    Log.e(TAG, "No config provided")
                    stopSelf()
                    return START_NOT_STICKY
                }
                startVpn(configJson)
            }
            else -> {
                stopSelf()
                return START_NOT_STICKY
            }
        }
        return START_STICKY
    }

    private fun startVpn(configJson: String) {
        try {
            // Create TUN interface
            val builder = Builder()
                .setSession("Pixel VPN")
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)
                .addRoute("::", 0)
                .addDnsServer("1.1.1.1")
                .addDnsServer("8.8.8.8")
                .setMtu(1500)
                .setBlocking(false)

            // Exclude our own app to prevent loops
            try {
                builder.addDisallowedApplication(packageName)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to exclude own package: ${e.message}")
            }

            tunFd = builder.establish()
            if (tunFd == null) {
                Log.e(TAG, "Failed to establish TUN interface")
                stopSelf()
                return
            }

            val fd = tunFd!!.fd
            Log.i(TAG, "TUN interface established, fd=$fd")

            // Start xray-core via libXray with TUN fd and config
            // AndroidLibXrayLite expects the config JSON and uses the SOCKS proxy internally
            XrayCore.run(configJson)

            isRunning = true

            // Start foreground notification
            startForeground(VpnNotification.NOTIFICATION_ID, VpnNotification.build(this, true))

            Log.i(TAG, "VPN started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN: ${e.message}", e)
            stopVpn()
            stopSelf()
        }
    }

    private fun stopVpn() {
        try {
            XrayCore.stop()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping xray: ${e.message}")
        }

        tunFd?.close()
        tunFd = null
        isRunning = false

        stopForeground(STOP_FOREGROUND_REMOVE)
        Log.i(TAG, "VPN stopped")
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    override fun onRevoke() {
        stopVpn()
        stopSelf()
        super.onRevoke()
    }
}
