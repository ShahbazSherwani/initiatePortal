{
  "email": "1.user.email",
  "first_name": "1.user.first_name",
  "last_name": "1.user.last_name",
  "middle_name": "1.user.middle_name",
  "phone_number": "1.user.phone_number",
  "date_of_birth": "1.user.date_of_birth",
  "age": "1.user.age",
  "gender": "1.user.gender",
  "about_you": "1.user.about_you",
  "display_name": "1.user.display_name",
  "global_user_id": "1.user.global_user_id",
  "source_system": "1.source_system",
  "source_event_id": "1.source_event_id"
}<?php
/**
 * Quick Script to Check Recent Sync Logs
 * Upload to WordPress root and access via browser
 */

require_once('./wp-load.php');

// Find user by email
$user = get_user_by('email', 'shobi0321@gmail.com');

echo "<h1>Sync Status Check</h1>";
echo "<pre>";

if ($user) {
    echo "✓ User Found:\n";
    echo "  ID: {$user->ID}\n";
    echo "  Email: {$user->user_email}\n";
    echo "  Registered: {$user->user_registered}\n";
    echo "  synced_from: " . (get_user_meta($user->ID, 'synced_from', true) ?: 'none') . "\n";
    echo "  ph_user_id: " . (get_user_meta($user->ID, 'ph_user_id', true) ?: 'none') . "\n";
} else {
    echo "✗ User not found: shobi0321@gmail.com\n";
}

echo "\n========================================\n";
echo "Recent debug.log entries for 'InitiateGlobal Sync':\n";
echo "========================================\n\n";

// Read last 200 lines of debug.log
$log_file = WP_CONTENT_DIR . '/debug.log';

if (file_exists($log_file)) {
    $lines = file($log_file);
    $recent_lines = array_slice($lines, -200);
    
    $sync_logs = array_filter($recent_lines, function($line) {
        return strpos($line, 'InitiateGlobal Sync') !== false;
    });
    
    if (empty($sync_logs)) {
        echo "⚠ No 'InitiateGlobal Sync' logs found in recent entries.\n";
        echo "   This means the sync function hasn't been triggered yet.\n";
    } else {
        foreach ($sync_logs as $log) {
            echo $log;
        }
    }
} else {
    echo "✗ debug.log file not found at: {$log_file}\n";
}

echo "\n</pre>";
