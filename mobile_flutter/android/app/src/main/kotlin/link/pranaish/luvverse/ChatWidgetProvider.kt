package link.pranaish.luvverse

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews

/**
 * AppWidgetProvider for the LuvVerse Chat widget.
 * Displays the last message from the partner.
 */
class ChatWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // First widget placed
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }

    companion object {
        private const val PREFS_NAME = "HomeWidgetPreferences"

        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs: SharedPreferences =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val partnerName = prefs.getString("partner_name", "Partner") ?: "Partner"
            val lastMessage = prefs.getString("last_message", "No messages yet") ?: "No messages yet"
            val messageTime = prefs.getString("message_time", "") ?: ""

            val views = RemoteViews(context.packageName, R.layout.chat_widget)
            views.setTextViewText(R.id.tv_partner_name, partnerName)
            views.setTextViewText(R.id.tv_last_message, lastMessage)
            views.setTextViewText(R.id.tv_message_time, messageTime)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
