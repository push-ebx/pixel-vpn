package com.pixelvpn.app

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import go.Seq
import libv2ray.CoreCallbackHandler
import libv2ray.CoreController
import libv2ray.Libv2ray

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
    private var coreController: CoreController? = null

    override fun onCreate() {
        super.onCreate()
        Seq.setContext(applicationContext)
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

                // Foreground must start immediately after startForegroundService().
                startForeground(VpnNotification.NOTIFICATION_ID, VpnNotification.build(this, false))
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
            Log.i(TAG, "VPN start: building TUN")

            // Create TUN interface
            val builder = Builder()
                .setSession("Pixel VPN")
                .addAddress("10.0.0.1", 30)
                .addRoute("0.0.0.0", 0)
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

            // Start xray-core via AndroidLibXrayLite.
            Log.i(TAG, "VPN start: initCoreEnv")
            Seq.setContext(applicationContext)
            Libv2ray.initCoreEnv(filesDir.absolutePath, cacheDir.absolutePath)
            val callbackHandler = object : CoreCallbackHandler {
                override fun onEmitStatus(l: Long, s: String?): Long {
                    if (!s.isNullOrBlank()) {
                        Log.i(TAG, "xray status: $s")
                    }
                    return 0
                }

                override fun shutdown(): Long {
                    Log.i(TAG, "xray requested shutdown")
                    return 0
                }

                override fun startup(): Long {
                    Log.i(TAG, "xray startup callback")
                    return 0
                }
            }

            Log.i(TAG, "VPN start: newCoreController")
            coreController = Libv2ray.newCoreController(callbackHandler)
            Log.i(TAG, "VPN start: startLoop")
            coreController?.startLoop(configJson, fd)

            try {
                val delayMs = coreController?.measureDelay("https://cp.cloudflare.com/generate_204")
                Log.i(TAG, "xray measureDelay: ${delayMs}ms")
            } catch (e: Exception) {
                Log.e(TAG, "xray measureDelay failed: ${e.message}", e)
            }

            isRunning = true

            // Update foreground notification to connected state.
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
            coreController?.stopLoop()
            coreController = null
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
