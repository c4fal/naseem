package com.naseem.downloader

import android.app.Application

class NaseemApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Engine.init(this)
    }
}
