package com.pixelvpn.app

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import app.tauri.plugin.JSObject

@TauriPlugin
class VpnPlugin(private val activity: Activity) : Plugin(activity) {

    companion object {
        private const val TAG = "VpnPlugin"
        const val VPN_PERMISSION_REQUEST = 1001

        // Static state for handling VPN permission result across Activity lifecycle
        private var pendingConfigJson: String? = null
        private var pendingInvoke: Invoke? = null
        private var instance: VpnPlugin? = null
    }

    init {
        instance = this
    }

    @Command
    fun startVpn(invoke: Invoke) {
        val args = invoke.parseArgs(JSObject::class.java)
        val configJson = args.getString("configJson")

        if (configJson.isNullOrEmpty()) {
            invoke.reject("configJson is required")
            return
        }

        Log.i(TAG, "startVpn called")

        // Check if VPN permission is needed
        val prepareIntent = VpnService.prepare(activity)
        if (prepareIntent != null) {
            // Need user permission — store config and invoke for later
            pendingConfigJson = configJson
            pendingInvoke = invoke
            activity.startActivityForResult(prepareIntent, VPN_PERMISSION_REQUEST)
        } else {
            // Already have permission — start immediately
            doStartVpn(configJson, invoke)
        }
    }

    @Command
    fun stopVpn(invoke: Invoke) {
        Log.i(TAG, "stopVpn called")
        val intent = Intent(activity, PixelVpnService::class.java).apply {
            action = PixelVpnService.ACTION_STOP
        }
        activity.startService(intent)
        invoke.resolve(JSObject().put("status", "stopped"))
    }

    @Command
    fun getVpnStatus(invoke: Invoke) {
        invoke.resolve(JSObject().put("running", PixelVpnService.isRunning))
    }

    private fun doStartVpn(configJson: String, invoke: Invoke?) {
        try {
            val intent = Intent(activity, PixelVpnService::class.java).apply {
                action = PixelVpnService.ACTION_START
                putExtra(PixelVpnService.EXTRA_CONFIG, configJson)
            }
            activity.startForegroundService(intent)
            invoke?.resolve(JSObject().put("status", "started"))
            Log.i(TAG, "VPN service start requested")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN service: ${e.message}", e)
            invoke?.reject("Failed to start VPN: ${e.message}")
        }
    }

    // Called from MainActivity.onActivityResult
    fun handleVpnPermissionResult(granted: Boolean) {
        if (granted && pendingConfigJson != null) {
            doStartVpn(pendingConfigJson!!, pendingInvoke)
        } else {
            pendingInvoke?.reject("VPN permission denied by user")
        }
        pendingConfigJson = null
        pendingInvoke = null
    }

    // Static accessor for MainActivity to call
    object PermissionHandler {
        fun onResult(granted: Boolean) {
            instance?.handleVpnPermissionResult(granted)
        }
    }
}
