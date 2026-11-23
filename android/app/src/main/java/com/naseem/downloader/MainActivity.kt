package com.naseem.downloader

import android.Manifest
import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import kotlin.coroutines.resume

class MainActivity : ComponentActivity(), Engine.Ui {
    private lateinit var root: FrameLayout
    private lateinit var web: WebView
    private var pageReady = false
    private var pendingShare: String? = null
    private var pickWaiter: CancellableContinuation<Uri?>? = null

    private val picker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        pickWaiter?.resume(uri); pickWaiter = null
    }
    private val notifPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        root = FrameLayout(this).apply { setBackgroundColor(Color.parseColor("#0d1117")) }
        web = WebView(this)
        root.addView(web, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
        setContentView(root)

        // Keep the page clear of the status bar, navigation bar and keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }

        val assets = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE // some sites serve http thumbnails
        }
        web.webChromeClient = WebChromeClient() // enables confirm() dialogs
        web.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest) = assets.shouldInterceptRequest(request.url)
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.scheme in setOf("http", "https")) runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                return true
            }
            override fun onPageFinished(view: WebView, url: String) {
                pageReady = true
                pendingShare?.let { emit("share:url", JSONObject.quote(it)) }
                pendingShare = null
            }
        }
        web.addJavascriptInterface(Bridge(), "NaseemNative")
        Engine.ui = this
        handleShare(intent)
        web.loadUrl("https://appassets.androidplatform.net/assets/www/renderer/index.html")

        onBackPressedDispatcher.addCallback(this) {
            web.evaluateJavascript("window.__nsmBack && __nsmBack()") { handled -> if (handled != "true") moveTaskToBack(true) }
        }
        if (Engine.notifyEnabled()) requestNotifications()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShare(intent)
    }

    private fun handleShare(i: Intent?) {
        if (i?.action != Intent.ACTION_SEND) return
        val url = Regex("https?://\\S+", RegexOption.IGNORE_CASE).find(i.getStringExtra(Intent.EXTRA_TEXT) ?: "")?.value ?: return
        if (pageReady) emit("share:url", JSONObject.quote(url)) else pendingShare = url
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && pageReady) Engine.onAppFocused()
    }

    override fun onDestroy() {
        if (Engine.ui === this) Engine.ui = null
        pickWaiter?.resume(null)
        web.destroy()
        super.onDestroy()
    }

    inner class Bridge {
        @JavascriptInterface
        fun invoke(id: Int, channel: String, args: String) {
            Engine.handleAsync(channel, args) { json ->
                runOnUiThread { if (!isDestroyed) web.evaluateJavascript("__nsm.resolve($id,${JSONObject.quote(json)})", null) }
            }
        }
    }

    // ---------- Engine.Ui ----------
    override fun emit(channel: String, json: String) = runOnUiThread {
        if (!isDestroyed) web.evaluateJavascript("__nsm.emit(${JSONObject.quote(channel)},${JSONObject.quote(json)})", null)
    }

    override suspend fun pickFile(mime: String): Uri? = suspendCancellableCoroutine { c ->
        pickWaiter?.resume(null)
        pickWaiter = c
        picker.launch(mime)
    }

    override fun requestNotifications() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun setThemeColors(bg: String, light: Boolean) {
        val rgb = Regex("\\d+").findAll(bg).map { it.value.toInt() }.toList()
        if (rgb.size >= 3) root.setBackgroundColor(Color.rgb(rgb[0], rgb[1], rgb[2]))
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
    }

    private val clipboard get() = getSystemService(ClipboardManager::class.java)
    override fun clipboardText(): String? = clipboard.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(this)?.toString()
    override fun setClipboardText(text: String) = clipboard.setPrimaryClip(ClipData.newPlainText("Naseem", text))
}
