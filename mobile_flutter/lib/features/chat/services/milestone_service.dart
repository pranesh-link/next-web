/// Calculates couple milestones based on the couple's createdAt date.
class MilestoneService {
  /// Check if today has any milestones for the given couple start date.
  List<Milestone> getMilestonesForToday(DateTime coupleCreatedAt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final start = DateTime(
      coupleCreatedAt.year,
      coupleCreatedAt.month,
      coupleCreatedAt.day,
    );
    final daysTogether = today.difference(start).inDays;
    final milestones = <Milestone>[];

    // Every 100 days milestone
    if (daysTogether > 0 && daysTogether % 100 == 0) {
      milestones.add(Milestone(
        text: '$daysTogether days together!',
        emoji: '🎉',
        type: MilestoneType.dayCount,
      ));
    }

    // Monthly anniversary (same day of month)
    if (daysTogether >= 30 &&
        today.day == start.day &&
        !(today.month == start.month && today.year == start.year)) {
      final months = _monthsBetween(start, today);
      if (months > 0 && months % 12 != 0) {
        milestones.add(Milestone(
          text: 'Happy $months-month anniversary!',
          emoji: '💕',
          type: MilestoneType.monthly,
        ));
      }
    }

    // Yearly anniversary
    if (today.month == start.month &&
        today.day == start.day &&
        today.year > start.year) {
      final years = today.year - start.year;
      milestones.add(Milestone(
        text: 'Happy $years-year anniversary!',
        emoji: '🥂',
        type: MilestoneType.yearly,
      ));
    }

    return milestones;
  }

  int _monthsBetween(DateTime from, DateTime to) {
    return (to.year - from.year) * 12 + (to.month - from.month);
  }
}

enum MilestoneType { dayCount, monthly, yearly }

class Milestone {
  final String text;
  final String emoji;
  final MilestoneType type;

  const Milestone({
    required this.text,
    required this.emoji,
    required this.type,
  });
}
