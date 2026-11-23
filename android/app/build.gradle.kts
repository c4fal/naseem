import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The desktop app (one folder up) is the source of the version number and of the screens.
val desktopDir: File = rootDir.parentFile
val appVersion = (JsonSlurper().parse(File(desktopDir, "package.json")) as Map<*, *>)["version"] as String
// Release signing key lives outside the repo: ~/.naseem/keystore.properties
val keystoreProps = Properties().apply {
    val f = File(System.getProperty("user.home"), ".naseem/keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.naseem.downloader"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.naseem.downloader"
        minSdk = 29
        targetSdk = 36
        versionName = appVersion
        versionCode = appVersion.split(".").map(String::toInt).let { (a, b, c) -> a * 10000 + b * 100 + c }
    }

    signingConfigs {
        if (!keystoreProps.isEmpty) create("release") {
            storeFile = file(keystoreProps.getProperty("storeFile"))
            storePassword = keystoreProps.getProperty("storePassword")
            keyAlias = keystoreProps.getProperty("keyAlias")
            keyPassword = keystoreProps.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")
        }
    }

    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = false
        }
    }

    // yt-dlp's Python and ffmpeg ship as .so files that must be unpacked on install
    packaging { jniLibs { useLegacyPackaging = true } }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web"))
    sourceSets["main"].res.srcDir(layout.buildDirectory.dir("generated/icon"))
}

kotlin { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } }

// Reuse the desktop screens as-is; index.html only gets the Android bridge and phone styles added.
val copyWeb by tasks.registering(Sync::class) {
    into(layout.buildDirectory.dir("generated/web/www"))
    from(File(desktopDir, "renderer")) {
        into("renderer")
        filesMatching("index.html") {
            filter { line: String ->
                line.replace("<link rel=\"stylesheet\" href=\"styles.css\">", "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><link rel=\"stylesheet\" href=\"styles.css\"><link rel=\"stylesheet\" href=\"android/android.css\">")
                    .replace("<script src=\"app.js\"></script>", "<script src=\"android/api.js\"></script><script src=\"app.js\"></script>")
            }
        }
    }
    from("src/main/web") { into("renderer/android") }
    from(File(desktopDir, "build/icon.png")) { into("build") }
    from(File(desktopDir, "node_modules/@fontsource/ibm-plex-sans-arabic")) { into("node_modules/@fontsource/ibm-plex-sans-arabic") }
    doLast {
        val html = destinationDir.resolve("renderer/index.html").readText()
        check("android/api.js" in html && "android/android.css" in html) { "renderer/index.html changed: the Android bridge could not be added" }
    }
}

val copyIcon by tasks.registering(Sync::class) {
    into(layout.buildDirectory.dir("generated/icon/mipmap-xxxhdpi"))
    from(File(desktopDir, "build/icon.png")) { rename { "ic_launcher.png" } }
}

tasks.named("preBuild") { dependsOn(copyWeb, copyIcon) }

dependencies {
    implementation("io.github.junkfood02.youtubedl-android:library:0.18.1")
    implementation("io.github.junkfood02.youtubedl-android:ffmpeg:0.18.1")
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
}
