package com.pillping

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import java.io.File
import java.security.MessageDigest
import java.util.Locale
import java.util.UUID

class AlarmToneModule(private val appContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(appContext), ActivityEventListener {

  private var pickerPromise: Promise? = null
  private val pickerRequestCode = 0x5049
  private val storagePermissionRequestCode = 0x5050

  init {
    appContext.addActivityEventListener(this)
  }

  override fun getName() = "PillPingAlarmTone"

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
  }

  @ReactMethod
  fun pickAudio(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("unsupported", "Custom notification sounds require Android 8 or later.")
      return
    }
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "PillPing could not open the audio picker.")
      return
    }
    if (pickerPromise != null) {
      promise.reject("picker_busy", "The audio picker is already open.")
      return
    }

    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
      ContextCompat.checkSelfPermission(appContext, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED
    ) {
      val permissionActivity = activity as? PermissionAwareActivity
      if (permissionActivity == null) {
        promise.reject("permission_unavailable", "Storage permission could not be requested.")
        return
      }
      pickerPromise = promise
      permissionActivity.requestPermissions(
        arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
        storagePermissionRequestCode,
        PermissionListener { requestCode, _, grantResults ->
          if (requestCode != storagePermissionRequestCode) return@PermissionListener false
          val pending = pickerPromise
          if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            launchPicker(pending)
          } else {
            pickerPromise = null
            pending?.reject("permission_denied", "Storage access is needed to import a notification sound.")
          }
          true
        },
      )
      return
    }

    pickerPromise = promise
    launchPicker(promise)
  }

  private fun launchPicker(promise: Promise?) {
    val activity = appContext.currentActivity
    if (activity == null || promise == null) {
      pickerPromise = null
      promise?.reject("no_activity", "PillPing could not open the audio picker.")
      return
    }
    try {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "audio/*"
        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"))
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      activity.startActivityForResult(intent, pickerRequestCode)
    } catch (error: Exception) {
      pickerPromise = null
      promise.reject("picker_failed", "PillPing could not open the audio picker.", error)
    }
  }

  override fun onActivityResult(activity: android.app.Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != pickerRequestCode) return
    val promise = pickerPromise ?: return
    pickerPromise = null
    if (resultCode != android.app.Activity.RESULT_OK || data?.data == null) {
      promise.resolve(null)
      return
    }

    try {
      val sourceUri = data.data!!
      val fileName = getDisplayName(sourceUri)
      val extension = fileName.substringAfterLast('.', "").lowercase(Locale.ROOT)
      if (extension !in setOf("mp3", "wav", "m4a", "aac")) {
        promise.reject("unsupported_format", "Choose an MP3, WAV, M4A, or AAC audio file.")
        return
      }
      val importedUri = importAudio(sourceUri, fileName)
      val result = Arguments.createMap().apply {
        putString("uri", importedUri.toString())
        putString("fileName", fileName)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("import_failed", "PillPing could not import that audio file.", error)
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  private fun getDisplayName(uri: Uri): String {
    appContext.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val column = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (column >= 0) cursor.getString(column)?.takeIf { it.isNotBlank() }?.let { return it }
      }
    }
    return "Alarm sound.mp3"
  }

  private fun importAudio(sourceUri: Uri, originalName: String): Uri {
    val extension = originalName.substringAfterLast('.', "mp3").lowercase(Locale.ROOT)
    val mimeType = when (extension) {
      "wav" -> "audio/wav"
      "m4a" -> "audio/mp4"
      "aac" -> "audio/aac"
      else -> "audio/mpeg"
    }
    val storedName = "pillping_${UUID.randomUUID()}.$extension"
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, storedName)
      put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
      put(MediaStore.Audio.AudioColumns.IS_NOTIFICATION, 1)
      put(MediaStore.Audio.AudioColumns.IS_RINGTONE, 1)
      put(MediaStore.Audio.AudioColumns.IS_ALARM, 1)
      put(MediaStore.Audio.AudioColumns.IS_MUSIC, 0)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_RINGTONES}/PillPing")
        put(MediaStore.MediaColumns.IS_PENDING, 1)
      } else {
        val directory = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_RINGTONES), "PillPing")
        if (!directory.exists() && !directory.mkdirs()) throw IllegalStateException("Could not create the alarm sound directory.")
        put(MediaStore.MediaColumns.DATA, File(directory, storedName).absolutePath)
      }
    }
    val resolver = appContext.contentResolver
    val destination = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values)
      ?: throw IllegalStateException("Could not create an imported audio file.")
    try {
      resolver.openInputStream(sourceUri)?.use { source ->
        resolver.openOutputStream(destination, "w")?.use { target ->
          source.copyTo(target)
        } ?: throw IllegalStateException("Could not write the selected audio file.")
      } ?: throw IllegalStateException("The selected audio file is unavailable.")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        resolver.update(destination, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
      }
      validateAudio(destination)
      return destination
    } catch (error: Exception) {
      resolver.delete(destination, null, null)
      throw error
    }
  }

  private fun validateAudio(uri: Uri) {
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(appContext, uri)
      val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
      if (duration == null || duration <= 0) throw IllegalArgumentException("The selected file does not contain playable audio.")
    } finally {
      retriever.release()
    }
  }

  @ReactMethod
  fun isAudioAvailable(uriText: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriText)
      promise.resolve(isManagedAudio(uri) && appContext.contentResolver.openFileDescriptor(uri, "r")?.use { true } == true)
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun createSoundChannel(uriText: String, fileName: String, soundEnabled: Boolean, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("unsupported", "Custom notification sounds require Android 8 or later.")
      return
    }
    try {
      val soundUri = Uri.parse(uriText)
      if (soundEnabled && !isManagedAudio(soundUri)) {
        promise.reject("invalid_audio", "The selected alarm sound is no longer available.")
        return
      }
      val suffix = if (soundEnabled) "sound" else "silent"
      val channelId = deviceChannelId(uriText, suffix)
      val channel = NotificationChannel(
        channelId,
        "PillPing reminders: ${fileName.take(40)}",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        if (soundEnabled) {
          setSound(
            soundUri,
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build(),
          )
        } else {
          setSound(null, null)
        }
        enableVibration(true)
      }
      val manager = appContext.getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
      promise.resolve(channelId)
    } catch (error: Exception) {
      promise.reject("channel_failed", "PillPing could not configure this alarm sound.", error)
    }
  }

  @ReactMethod
  fun deleteImportedAudio(uriText: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriText)
      val manager = appContext.getSystemService(NotificationManager::class.java)
      manager.deleteNotificationChannel(deviceChannelId(uriText, "sound"))
      manager.deleteNotificationChannel(deviceChannelId(uriText, "silent"))
      if (!isManagedAudio(uri)) {
        promise.resolve(false)
        return
      }
      promise.resolve(appContext.contentResolver.delete(uri, null, null) > 0)
    } catch (error: Exception) {
      promise.reject("delete_failed", "PillPing could not remove the old imported alarm sound.", error)
    }
  }

  private fun deviceChannelId(uriText: String, suffix: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest("$uriText:$suffix".toByteArray())
      .take(8).joinToString("") { "%02x".format(it) }
    return "medicine-reminders-v1-device-$digest"
  }

  private fun isManagedAudio(uri: Uri): Boolean {
    if (uri.authority != MediaStore.AUTHORITY) return false
    val columns = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      arrayOf(MediaStore.MediaColumns.RELATIVE_PATH)
    } else {
      arrayOf(MediaStore.MediaColumns.DATA)
    }
    appContext.contentResolver.query(uri, columns, null, null, null)?.use { cursor ->
      if (!cursor.moveToFirst()) return false
      val location = cursor.getString(0) ?: return false
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        location.trimEnd('/') == "${Environment.DIRECTORY_RINGTONES}/PillPing"
      } else {
        location.startsWith(File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_RINGTONES), "PillPing").absolutePath)
      }
    }
    return false
  }
}