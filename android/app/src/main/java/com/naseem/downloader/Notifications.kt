package com.naseem.downloader

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri

object Notifications {
    const val PROGRESS_ID = 1
    private const val CH_PROGRESS = "progress"
    private const val CH_DONE = "done"

    private fun ar() = Engine.lang == "ar"
    private fun nm(c: Context) = c.getSystemService(NotificationManager::class.java)

    fun createChannels(c: Context) {
        nm(c).createNotificationChannels(listOf(
            NotificationChannel(CH_PROGRESS, if (ar()) "التنزيلات الجارية" else "Active downloads", NotificationManager.IMPORTANCE_LOW),
            NotificationChannel(CH_DONE, if (ar()) "اكتمال التنزيل" else "Finished downloads", NotificationManager.IMPORTANCE_DEFAULT),
        ))
    }

    private fun openApp(c: Context) = PendingIntent.getActivity(c, 0, Intent(c, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)

    fun progress(c: Context, n: Int): Notification = Notification.Builder(c, CH_PROGRESS)
        .setSmallIcon(android.R.drawable.stat_sys_download)
        .setContentTitle(if (ar()) "نسيم" else "Naseem")
        .setContentText(if (ar()) "جارٍ تنزيل $n ملف…" else "Downloading $n file${if (n == 1) "" else "s"}…")
        .setContentIntent(openApp(c))
        .setOngoing(true)
        .build()

    fun refreshProgress(c: Context, n: Int) {
        if (nm(c).areNotificationsEnabled()) nm(c).notify(PROGRESS_ID, progress(c, n))
    }

    fun done(c: Context, title: String, file: Uri) {
        if (!nm(c).areNotificationsEnabled()) return
        val view = Intent(Intent.ACTION_VIEW).setDataAndType(file, c.contentResolver.getType(file))
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        val tap = PendingIntent.getActivity(c, file.hashCode(), view, PendingIntent.FLAG_IMMUTABLE)
        val n = Notification.Builder(c, CH_DONE)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle(if (ar()) "اكتمل التنزيل" else "Download complete")
            .setContentText(title)
            .setContentIntent(tap)
            .setAutoCancel(true)
            .build()
        nm(c).notify(file.hashCode(), n)
    }
}
