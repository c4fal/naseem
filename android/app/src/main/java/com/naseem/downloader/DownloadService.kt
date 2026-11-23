package com.naseem.downloader

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo

/** Keeps the app process alive while downloads run, so they continue with the screen off or in another app. */
class DownloadService : Service() {
    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        running = true
        startForeground(Notifications.PROGRESS_ID, Notifications.progress(this, Engine.activeCount().coerceAtLeast(1)), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        if (Engine.activeCount() == 0) stopSelf()
        return START_NOT_STICKY
    }

    // Android 15+ limits data-sync services to 6 hours a day
    override fun onTimeout(startId: Int, fgsType: Int) = stopSelf()

    override fun onDestroy() {
        running = false
        super.onDestroy()
    }

    companion object {
        @Volatile var running = false
    }
}
