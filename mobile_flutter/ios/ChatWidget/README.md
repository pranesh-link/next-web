# iOS Chat Widget (WidgetKit)

## Setup Instructions

To add the iOS home screen widget:

1. In Xcode, go to File → New → Target → Widget Extension
2. Name it `ChatWidget`
3. Set the App Group to `group.link.pranesh.luvverse`

## SwiftUI Widget Code (ChatWidget.swift)

```swift
import WidgetKit
import SwiftUI

struct ChatWidgetEntry: TimelineEntry {
    let date: Date
    let partnerName: String
    let lastMessage: String
    let messageTime: String
}

struct ChatWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> ChatWidgetEntry {
        ChatWidgetEntry(date: Date(), partnerName: "Partner", lastMessage: "No messages", messageTime: "")
    }

    func getSnapshot(in context: Context, completion: @escaping (ChatWidgetEntry) -> Void) {
        let entry = ChatWidgetEntry(date: Date(), partnerName: "Partner", lastMessage: "Loading...", messageTime: "")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ChatWidgetEntry>) -> Void) {
        let sharedDefaults = UserDefaults(suiteName: "group.link.pranesh.luvverse")
        let partnerName = sharedDefaults?.string(forKey: "partner_name") ?? "Partner"
        let lastMessage = sharedDefaults?.string(forKey: "last_message") ?? "No messages yet"
        let messageTime = sharedDefaults?.string(forKey: "message_time") ?? ""

        let entry = ChatWidgetEntry(date: Date(), partnerName: partnerName, lastMessage: lastMessage, messageTime: messageTime)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct ChatWidgetView: View {
    var entry: ChatWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.partnerName)
                .font(.headline)
                .foregroundColor(.primary)
            Text(entry.lastMessage)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            if !entry.messageTime.isEmpty {
                Text(entry.messageTime)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            Spacer()
            HStack {
                Spacer()
                Text("💕 LuvVerse")
                    .font(.caption2)
                    .foregroundColor(.purple.opacity(0.6))
            }
        }
        .padding()
    }
}

@main
struct ChatWidget: Widget {
    let kind: String = "ChatWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChatWidgetProvider()) { entry in
            ChatWidgetView(entry: entry)
        }
        .configurationDisplayName("LuvVerse Chat")
        .description("See your latest message from your partner.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

## Notes
- The `home_widget` Flutter package writes data to the shared UserDefaults (App Group)
- The widget reads from `group.link.pranesh.luvverse` UserDefaults
- Add the App Group capability to both the main app target and widget extension
