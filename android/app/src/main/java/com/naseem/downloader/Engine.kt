package com.naseem.downloader

import android.app.Application
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.core.content.ContextCompat
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** Android counterpart of main.js: settings, history, the download queue and the yt-dlp engine. */
object Engine {
    interface Ui {
        fun emit(channel: String, json: String)
        suspend fun pickFile(mime: String): Uri?
        fun requestNotifications()
        fun setThemeColors(bg: String, light: Boolean)
        fun clipboardText(): String?
        fun setClipboardText(text: String)
    }

    private const val TAG = "Naseem"
    private val ACTIVE = setOf("starting", "downloading", "processing")
    private val IMG_SLOTS = mapOf("bg" to ("bgImage" to "background"), "art" to ("artImage" to "side-art"))
    private const val IMPORTED_COOKIES = "cookies-import.txt"

    lateinit var app: Application
        private set
    @Volatile var ui: Ui? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val ready = CompletableDeferred<Throwable?>()
    private lateinit var settings: JSONObject
    private lateinit var history: JSONArray
    private val jobs = LinkedHashMap<String, Job>()
    private var seq = 0
    private var ytdlpVersion: String? = null
    private var lastClip: String? = null

    private val prefs by lazy { app.getSharedPreferences("naseem", Context.MODE_PRIVATE) }
    private val historyFile by lazy { File(app.filesDir, "history.json") }
    private val workRoot by lazy { File(app.noBackupFilesDir, "downloads") }

    private fun defaults() = JSONObject(
        """{"downloadDir":"Download/Naseem","concurrency":2,"container":"mp4","preferH264":true,"defaultMode":"video",
        "defaultQuality":"best","audioFormat":"mp3","embedThumbnail":true,"embedSubs":false,"subLangs":"ar,en","sponsorblock":false,
        "cookiesBrowser":"","cookiesFile":"","proxy":"","rateLimit":"","filenameTemplate":"%(title)s [%(id)s].%(ext)s",
        "clipboardWatch":true,"notify":true,"autoFetchOnPaste":true,"lang":"ar","theme":"dark","motion":"on",
        "bgImage":"","bgVisibility":25,"artImage":"","artVisibility":55}"""
    )

    fun init(a: Application) {
        app = a
        settings = defaults()
        runCatching { JSONObject(prefs.getString("settings", "{}")!!) }.getOrNull()?.let { s -> s.keys().forEach { settings.put(it, s.get(it)) } }
        history = runCatching { JSONArray(historyFile.readText()) }.getOrElse { JSONArray() }
        Notifications.createChannels(a)
        scope.launch(Dispatchers.IO) {
            workRoot.deleteRecursively() // queue is in memory only, so leftovers belong to no job
            val err = runCatching { YoutubeDL.init(a); FFmpeg.init(a) }.exceptionOrNull()?.also { Log.e(TAG, "engine init failed", it) }
            if (err == null) autoUpdate() // before completing, so engineReady() sees the update
            ready.complete(err)
        }
    }

    // The yt-dlp bundled in the APK is months old and YouTube rejects it, so refresh it daily.
    @Volatile private var updating: kotlinx.coroutines.Job? = null

    private fun autoUpdate() {
        if (System.currentTimeMillis() - prefs.getLong("ytdlpUpdatedAt", 0) < 24 * 3600 * 1000L) return
        updating = scope.launch(Dispatchers.IO) {
            runCatching { YoutubeDL.updateYoutubeDL(app, YoutubeDL.UpdateChannel.STABLE) }
                .onSuccess { prefs.edit().putLong("ytdlpUpdatedAt", System.currentTimeMillis()).apply(); ytdlpVersion = null }
                .onFailure { Log.w(TAG, "yt-dlp auto-update failed", it) }
        }
    }

    /** Waits for the engine, including a running yt-dlp update so it isn't replaced mid-use. */
    private suspend fun engineReady(): Throwable? {
        val err = ready.await()
        updating?.let { kotlinx.coroutines.withTimeoutOrNull(90_000) { it.join() } }
        return err
    }

    val lang: String get() = settings.optString("lang", "ar")
    fun notifyEnabled() = settings.optBoolean("notify", true)
    fun activeCount() = jobs.values.count { it.status in ACTIVE || it.status == "queued" }

    private fun saveSettings() = prefs.edit().putString("settings", settings.toString()).apply()
    private fun emit(channel: String, value: Any?) { ui?.emit(channel, toJson(value)) }

    fun toJson(v: Any?): String = when (v) {
        null -> "null"
        is JSONObject, is JSONArray, is Boolean, is Number -> v.toString()
        else -> JSONObject.quote(v.toString())
    }

    /** Called by the JavaScript bridge; replies with the result as JSON text. */
    fun handleAsync(channel: String, argsJson: String, reply: (String) -> Unit) {
        scope.launch {
            val result = try { handle(channel, JSONArray(argsJson)) } catch (e: Exception) { Log.e(TAG, "$channel failed", e); null }
            reply(toJson(result))
        }
    }

    private suspend fun handle(ch: String, a: JSONArray): Any? = when (ch) {
        "settings:get" -> settings
        "settings:set" -> setSettings(a.getJSONObject(0))
        "info:fetch" -> fetchInfo(a.getString(0))
        "download:add" -> addDownloads(a.get(0))
        "download:action" -> { action(a.getString(0), a.getString(1)); true }
        "download:list" -> JSONArray(jobs.values.map { it.toJson() })
        "download:clearFinished" -> { jobs.values.filter { it.status in setOf("done", "canceled", "error") }.forEach { remove(it) }; null }
        "download:pauseAll" -> { jobs.values.filter { it.status in ACTIVE || it.status == "queued" }.forEach { stop(it, "paused") }; null }
        "download:resumeAll" -> { jobs.values.filter { it.status == "paused" }.forEach { requeue(it) }; pump(); null }
        "download:retryAll" -> { jobs.values.filter { it.status == "error" || it.status == "canceled" }.forEach { requeue(it) }; pump(); null }
        "history:get" -> historyWithExists()
        "history:remove" -> { removeHistory(a.getString(0)); true }
        "history:clear" -> { history = JSONArray(); saveHistory(); true }
        "engine:status" -> engineStatus()
        "engine:install" -> ready.await().let { err -> emit("engine:progress", JSONObject().put("step", "done")); JSONObject().put("ok", err == null).putOpt("error", err?.message) }
        "engine:update" -> updateEngine()
        "shell:openFile" -> openFile(a.optString(0))
        "shell:showInFolder", "shell:openDir" -> startSafely(Intent(android.app.DownloadManager.ACTION_VIEW_DOWNLOADS))
        "shell:openExternal" -> a.optString(0).takeIf { it.matches(Regex("^https?://.*", RegexOption.IGNORE_CASE)) }?.let { startSafely(Intent(Intent.ACTION_VIEW, Uri.parse(it))) }
        "dialog:pickDir" -> null
        "img:get" -> IMG_SLOTS[a.getString(0)]?.let { imgDataUrl(it.first) }
        "img:pick" -> pickImage(a.getString(0))
        "img:clear" -> { IMG_SLOTS[a.getString(0)]?.let { (key, base) -> removeImgFiles(base); settings.put(key, ""); saveSettings() }; settings }
        "cookies:status" -> JSONObject().put("firefox", false)
        "cookies:firefoxSignIn" -> JSONObject().put("ok", false).put("error", "NO_FIREFOX")
        "cookies:import" -> importCookies()
        "cookies:clear" -> { File(app.filesDir, IMPORTED_COOKIES).delete(); settings.put("cookiesFile", ""); saveSettings(); settings }
        "clipboard:read" -> ui?.clipboardText() ?: ""
        "clipboard:write" -> { ui?.setClipboardText(a.optString(0)); null }
        "ui:theme" -> { a.getJSONObject(0).let { ui?.setThemeColors(it.optString("bg"), it.optBoolean("light")) }; null }
        else -> { Log.w(TAG, "unknown channel $ch"); null }
    }

    // ---------- settings ----------
    private fun setSettings(patch: JSONObject): JSONObject {
        patch.keys().forEach { settings.put(it, patch.get(it)) }
        saveSettings()
        if (patch.optBoolean("notify", false)) ui?.requestNotifications()
        pump()
        return settings
    }

    // ---------- engine ----------
    private suspend fun engineStatus(): JSONObject {
        val err = engineReady()
        if (err == null && ytdlpVersion == null) ytdlpVersion = withContext(Dispatchers.IO) {
            runCatching { YoutubeDL.execute(YoutubeDLRequest(emptyList<String>()).addOption("--version")).out.trim() }.getOrNull()
        }
        return JSONObject().putOpt("ytdlp", ytdlpVersion).putOpt("ffmpeg", if (err == null) "bundled" else null)
    }

    private suspend fun updateEngine(): JSONObject {
        if (engineReady() != null) return JSONObject().put("ok", false).put("error", "ENGINE_MISSING")
        return withContext(Dispatchers.IO) {
            try {
                val status = YoutubeDL.updateYoutubeDL(app, YoutubeDL.UpdateChannel.STABLE)
                prefs.edit().putLong("ytdlpUpdatedAt", System.currentTimeMillis()).apply()
                ytdlpVersion = null
                val v = runCatching { YoutubeDL.execute(YoutubeDLRequest(emptyList<String>()).addOption("--version")).out.trim() }.getOrNull()
                ytdlpVersion = v
                JSONObject().put("ok", true).put("output", "yt-dlp $v" + if (status == YoutubeDL.UpdateStatus.ALREADY_UP_TO_DATE) " (up to date)" else "")
            } catch (e: Exception) {
                JSONObject().put("ok", false).put("output", e.message ?: "Update failed")
            }
        }
    }

    private fun commonOptions(r: YoutubeDLRequest, cookies: File?) {
        r.addOption("--no-colors").addOption("--no-warnings")
        // YouTube needs a JavaScript runtime; the engine package ships QuickJS
        File(app.applicationInfo.nativeLibraryDir, "libqjs.so").takeIf { it.exists() }?.let { r.addOption("--js-runtimes", "quickjs:${it.absolutePath}") }
        if (cookies != null) r.addOption("--cookies", cookies.absolutePath)
        settings.optString("proxy").takeIf { it.isNotBlank() }?.let { r.addOption("--proxy", it) }
    }

    /** yt-dlp may rewrite the cookies file, so each run gets its own copy. */
    private fun prepareCookies(dir: File): File? {
        val src = File(app.filesDir, IMPORTED_COOKIES)
        if (settings.optString("cookiesFile").isEmpty() || !src.exists()) return null
        dir.mkdirs()
        return File(dir, "cookies.txt").also { src.copyTo(it, overwrite = true) }
    }

    private suspend fun fetchInfo(url: String): JSONObject {
        if (engineReady() != null) return JSONObject().put("ok", false).put("error", "ENGINE_MISSING")
        return withContext(Dispatchers.IO) {
            val tmp = File(app.cacheDir, "fetch-${System.nanoTime()}")
            try {
                val r = YoutubeDLRequest(url).addOption("-J").addOption("--flat-playlist")
                commonOptions(r, prepareCookies(tmp))
                JSONObject().put("ok", true).put("out", YoutubeDL.execute(r).out)
            } catch (e: Exception) {
                JSONObject().put("ok", false).put("error", cleanError(e.message))
            } finally {
                tmp.deleteRecursively()
            }
        }
    }

    // ---------- download queue ----------
    class Job(o: JSONObject, val id: String, defaultAudio: String) {
        val url: String = o.getString("url")
        var title: String = o.optString("title").ifEmpty { url }
        var thumbnail: String? = o.optString("thumbnail").ifEmpty { null }
        val mode = if (o.optString("mode") == "audio") "audio" else "video"
        val quality = o.optString("quality").ifEmpty { "best" }
        val audioFormat = o.optString("audioFormat").ifEmpty { defaultAudio }
        val subs = o.optBoolean("subs")
        val trimStart = o.optString("trimStart")
        val trimEnd = o.optString("trimEnd")
        val addedAt = System.currentTimeMillis()
        var status = "queued"
        var percent: Double? = 0.0
        var speed: Double? = null
        var eta: Double? = null
        var total: Double? = null
        var downloaded: Double? = null
        var error: String? = null
        var file: String? = null
        var size: Long? = null
        var finishedAt: Long? = null
        var lastSent = 0L
        val dir get() = File(Engine.workRoot, id)

        fun toJson(): JSONObject = JSONObject().put("id", id).put("url", url).put("title", title).putOpt("thumbnail", thumbnail)
            .put("mode", mode).put("quality", quality).put("audioFormat", audioFormat).put("subs", subs)
            .put("trimStart", trimStart).put("trimEnd", trimEnd).put("status", status).putOpt("percent", percent)
            .put("addedAt", addedAt).putOpt("speed", speed).putOpt("eta", eta).putOpt("total", total)
            .putOpt("downloaded", downloaded).putOpt("error", error).putOpt("file", file).putOpt("size", size)
            .putOpt("finishedAt", finishedAt)
    }

    private fun update(j: Job, force: Boolean = false, patch: Job.() -> Unit = {}) {
        val before = j.status
        j.patch()
        val now = System.currentTimeMillis()
        if (force || before != j.status || now - j.lastSent > 200) {
            j.lastSent = now
            emit("download:update", j.toJson())
        }
        if (before != j.status) updateService()
    }

    private fun addDownloads(items: Any): JSONArray {
        val list = if (items is JSONArray) (0 until items.length()).map { items.getJSONObject(it) } else listOf(items as JSONObject)
        val added = JSONArray()
        for (o in list) {
            if (o.optString("url").isEmpty()) continue
            val j = Job(o, "j${System.currentTimeMillis().toString(36)}${(seq++).toString(36)}", settings.optString("audioFormat", "mp3"))
            jobs[j.id] = j
            added.put(j.toJson())
            emit("download:update", j.toJson())
        }
        updateService()
        pump()
        return added
    }

    private fun action(id: String, action: String) {
        val j = jobs[id] ?: return
        when (action) {
            "cancel" -> if (j.status in ACTIVE || j.status == "queued" || j.status == "paused") stop(j, "canceled")
            "pause" -> if (j.status in ACTIVE || j.status == "queued") stop(j, "paused")
            "resume", "retry" -> if (j.status !in ACTIVE) { requeue(j); pump() }
            "remove" -> if (j.status !in ACTIVE) remove(j)
        }
    }

    private fun requeue(j: Job) = update(j, true) { status = "queued"; error = null }

    private fun remove(j: Job) {
        jobs.remove(j.id)
        j.dir.deleteRecursively()
        emit("download:removed", j.id)
    }

    private fun stop(j: Job, to: String) {
        val wasRunning = j.status in ACTIVE
        update(j, true) { status = to; speed = null; eta = null }
        if (wasRunning) YoutubeDL.destroyProcessById(j.id)
        else if (to == "canceled") j.dir.deleteRecursively()
    }

    private fun pump() {
        var slots = settings.optInt("concurrency", 2).coerceAtLeast(1) - jobs.values.count { it.status in ACTIVE }
        for (j in jobs.values.toList()) {
            if (slots <= 0) break
            if (j.status == "queued") { start(j); slots-- }
        }
    }

    private fun buildRequest(j: Job, cookies: File?): YoutubeDLRequest {
        val r = YoutubeDLRequest(j.url)
        commonOptions(r, cookies)
        r.addOption("--newline").addOption("--progress").addOption("--no-playlist").addOption("--no-simulate").addOption("--no-mtime")
            .addOption("-P", j.dir.absolutePath).addOption("-o", settings.optString("filenameTemplate").ifBlank { "%(title)s [%(id)s].%(ext)s" })
            .addOption("--trim-filenames", 80) // Android limits names to 255 bytes; Arabic letters take 2 each
            .addOption("--progress-template", "download:NSM|%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s")
            .addOption("--print", "video:NSMINFO|%(title)s|%(thumbnail)s")
            .addOption("--print", "after_move:NSMFILE|%(filepath)s")
            .addOption("--embed-metadata")
        if (j.mode == "audio") {
            r.addOption("-f", "ba/b").addOption("-x").addOption("--audio-format", j.audioFormat).addOption("--audio-quality", "0")
        } else {
            val h = j.quality.toIntOrNull()
            r.addOption("-f", if (h != null) "bv*[height<=$h]+ba/b[height<=$h]/bv*+ba/b" else "bv*+ba/b")
            if (settings.optBoolean("preferH264", true)) r.addOption("-S", "res,vcodec:h264,acodec:m4a")
            r.addOption("--merge-output-format", settings.optString("container", "mp4"))
            if (j.subs) r.addOption("--write-subs").addOption("--write-auto-subs").addOption("--sub-langs", settings.optString("subLangs").ifBlank { "ar,en" }).addOption("--embed-subs")
        }
        if (settings.optBoolean("embedThumbnail", true) && !(j.mode == "audio" && j.audioFormat == "wav")) r.addOption("--embed-thumbnail")
        if (j.trimStart.isNotEmpty() || j.trimEnd.isNotEmpty()) r.addOption("--download-sections", "*${j.trimStart.ifEmpty { "0" }}-${j.trimEnd.ifEmpty { "inf" }}").addOption("--force-keyframes-at-cuts")
        if (settings.optBoolean("sponsorblock") && j.mode != "audio") r.addOption("--sponsorblock-remove", "sponsor,selfpromo,interaction")
        settings.optString("rateLimit").takeIf { it.isNotBlank() }?.let { r.addOption("-r", it) }
        return r
    }

    private fun onLine(j: Job, line: String) = scope.launch {
        if (j.status !in ACTIVE) { YoutubeDL.destroyProcessById(j.id); return@launch } // paused/canceled before the process existed
        when {
            line.startsWith("NSM|") -> {
                val p = line.split("|")
                val num = { i: Int -> p.getOrNull(i)?.toDoubleOrNull() }
                val total = num(3) ?: num(4)
                val done = num(2)
                if (p.getOrNull(1) == "finished") update(j) { status = "processing"; percent = 100.0; speed = null; eta = null }
                else update(j) { status = "downloading"; percent = if (total != null && done != null) minOf(100.0, done / total * 100) else null; speed = num(5); eta = num(6); this.total = total; downloaded = done }
            }
            line.startsWith("NSMINFO|") -> {
                val p = line.split("|")
                update(j, true) {
                    p.getOrNull(1)?.takeIf { it != "NA" && (title.isEmpty() || title == url) }?.let { title = it }
                    p.getOrNull(2)?.takeIf { it != "NA" && thumbnail == null }?.let { thumbnail = it }
                }
            }
        }
    }

    private fun start(j: Job) {
        update(j, true) { status = "starting"; percent = 0.0; error = null; speed = null; eta = null }
        scope.launch {
            if (engineReady() != null) { update(j, true) { status = "error"; error = "ENGINE_MISSING" }; pump(); return@launch }
            if (j.status != "starting") return@launch
            try {
                val saved = withContext(Dispatchers.IO) {
                    j.dir.mkdirs()
                    val cookies = prepareCookies(File(j.dir, ".cookies"))
                    val resp = YoutubeDL.execute(buildRequest(j, cookies), j.id) { _, _, line -> onLine(j, line) }
                    val path = resp.out.lineSequence().lastOrNull { it.startsWith("NSMFILE|") }?.substring(8)?.trim()
                    val f = path?.let(::File)?.takeIf { it.isFile }
                        ?: j.dir.listFiles()?.filter { it.isFile && !it.name.endsWith(".part") }?.maxByOrNull { it.length() }
                        ?: error("Downloaded file not found")
                    publish(f).also { j.dir.deleteRecursively() }
                }
                update(j, true) { status = "done"; percent = 100.0; file = saved.first.toString(); size = saved.second; finishedAt = System.currentTimeMillis() }
                addHistory(j)
                if (notifyEnabled()) Notifications.done(app, j.title, saved.first)
            } catch (e: YoutubeDL.CanceledException) {
                if (j.status == "canceled") withContext(Dispatchers.IO) { j.dir.deleteRecursively() }
            } catch (e: Exception) {
                when (j.status) {
                    "canceled" -> withContext(Dispatchers.IO) { j.dir.deleteRecursively() }
                    "paused" -> Unit
                    else -> update(j, true) { status = "error"; error = cleanError(e.message) }
                }
            }
            pump()
        }
    }

    /** Moves a finished file into the phone's public Download/Naseem folder. */
    private fun publish(f: File): Pair<Uri, Long> {
        val cr = app.contentResolver
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(f.extension.lowercase()) ?: "application/octet-stream"
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, f.name)
            put(MediaStore.MediaColumns.MIME_TYPE, mime)
            put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_DOWNLOADS}/Naseem")
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: error("Could not save to Downloads")
        try {
            cr.openOutputStream(uri)!!.use { out -> f.inputStream().use { it.copyTo(out) } }
            cr.update(uri, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
        } catch (e: Exception) {
            cr.delete(uri, null, null)
            throw e
        }
        return uri to f.length()
    }

    private fun updateService() {
        val n = activeCount()
        if (n > 0 && !DownloadService.running) ContextCompat.startForegroundService(app, Intent(app, DownloadService::class.java))
        else if (n > 0) Notifications.refreshProgress(app, n)
        else if (DownloadService.running) app.stopService(Intent(app, DownloadService::class.java))
    }

    // ---------- history ----------
    private fun saveHistory() = runCatching { historyFile.writeText(history.toString()) }

    private fun addHistory(j: Job) {
        val e = JSONObject().put("id", j.id).put("title", j.title).put("url", j.url).putOpt("file", j.file).putOpt("thumbnail", j.thumbnail)
            .put("mode", j.mode).put("quality", j.quality).put("audioFormat", j.audioFormat).putOpt("size", j.size).put("date", System.currentTimeMillis())
        history = JSONArray(listOf(e) + (0 until minOf(history.length(), 999)).map { history.get(it) })
        saveHistory()
        emit("history:changed", history)
    }

    private fun removeHistory(id: String) {
        history = JSONArray((0 until history.length()).map { history.getJSONObject(it) }.filter { it.optString("id") != id })
        saveHistory()
    }

    private suspend fun historyWithExists(): JSONArray = withContext(Dispatchers.IO) {
        JSONArray((0 until history.length()).map { i ->
            val h = JSONObject(history.getJSONObject(i).toString())
            h.put("exists", h.optString("file").takeIf { it.isNotEmpty() }?.let { uriExists(Uri.parse(it)) } ?: false)
        })
    }

    private fun uriExists(uri: Uri) = runCatching {
        app.contentResolver.query(uri, arrayOf(MediaStore.MediaColumns._ID), null, null, null)?.use { it.count > 0 } ?: false
    }.getOrDefault(false)

    // ---------- shell ----------
    private fun startSafely(i: Intent) = runCatching { app.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }.isSuccess

    private fun openFile(p: String): Boolean {
        if (p.isEmpty()) return false
        val uri = Uri.parse(p)
        val i = Intent(Intent.ACTION_VIEW).setDataAndType(uri, app.contentResolver.getType(uri)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        return startSafely(i)
    }

    // ---------- custom images ----------
    private fun imgFile(key: String) = settings.optString(key).takeIf { it.isNotEmpty() }?.let { File(app.filesDir, it) }

    private fun imgDataUrl(key: String): String? {
        val f = imgFile(key)?.takeIf { it.exists() } ?: return null
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(f.extension) ?: "image/png"
        return "data:$mime;base64," + Base64.encodeToString(f.readBytes(), Base64.NO_WRAP)
    }

    private fun removeImgFiles(base: String) = app.filesDir.listFiles()?.filter { it.name.matches(Regex("^$base\\.[a-z]+$")) }?.forEach { it.delete() }

    private suspend fun pickImage(slot: String): JSONObject {
        val (key, base) = IMG_SLOTS[slot] ?: return JSONObject().put("ok", false)
        val uri = ui?.pickFile("image/*") ?: return JSONObject().put("ok", false)
        val ext = when (app.contentResolver.getType(uri)) { "image/jpeg" -> "jpg"; "image/webp" -> "webp"; "image/gif" -> "gif"; "image/png" -> "png"; else -> return JSONObject().put("ok", false).put("error", "TYPE") }
        val bytes = withContext(Dispatchers.IO) { app.contentResolver.openInputStream(uri)?.use { it.readBytes() } } ?: return JSONObject().put("ok", false)
        if (bytes.size > 20 * 1024 * 1024) return JSONObject().put("ok", false).put("error", "TOO_BIG")
        removeImgFiles(base)
        File(app.filesDir, "$base.$ext").writeBytes(bytes)
        settings.put(key, "$base.$ext"); saveSettings()
        return JSONObject().put("ok", true).put("url", imgDataUrl(key)).put("settings", settings)
    }

    private suspend fun importCookies(): JSONObject {
        val uri = ui?.pickFile("*/*") ?: return JSONObject().put("ok", false)
        var text = withContext(Dispatchers.IO) { app.contentResolver.openInputStream(uri)?.use { it.readBytes().decodeToString() } } ?: return JSONObject().put("ok", false)
        text = text.removePrefix("﻿")
        if (!Regex("^[^#\\r\\n][^\\t\\r\\n]*\\t(TRUE|FALSE)\\t", setOf(RegexOption.IGNORE_CASE, RegexOption.MULTILINE)).containsMatchIn(text)) return JSONObject().put("ok", false).put("error", "BAD_COOKIES")
        if (!Regex("^# (Netscape )?HTTP Cookie File").containsMatchIn(text)) text = "# Netscape HTTP Cookie File\n$text"
        File(app.filesDir, IMPORTED_COOKIES).writeText(text)
        settings.put("cookiesFile", IMPORTED_COOKIES); saveSettings()
        return JSONObject().put("ok", true).put("settings", settings)
    }

    // ---------- clipboard: suggest a copied link when the user comes back to Naseem ----------
    fun onAppFocused() {
        val t = ui?.clipboardText()?.trim() ?: return
        if (t == lastClip) return
        lastClip = t
        if (settings.optBoolean("clipboardWatch", true) && t.length < 2000 && Regex("^https?://\\S+$", RegexOption.IGNORE_CASE).matches(t)) emit("clipboard:url", t)
    }

    fun cleanError(text: String?): String {
        val lines = (text ?: "").lines().map { it.trim() }.filter { it.isNotEmpty() }
        val e = lines.lastOrNull { it.startsWith("ERROR") } ?: lines.lastOrNull() ?: "Unknown error"
        return e.removePrefix("ERROR:").trim().take(400)
    }
}
