import db from '../config/db';

/**
 * Creates a notification for a specific user.
 * Call this from any controller when a notable event occurs.
 */
export async function createNotification(
  profileId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO notifications (id, profile_id, title, message, read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())`,
      [profileId, title, message]
    );
  } catch (error) {
    // Log but never throw — notifications should not break the main flow
    console.error('Failed to create notification:', error);
  }
}
