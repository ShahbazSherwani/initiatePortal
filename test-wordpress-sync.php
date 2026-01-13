<?php
/**
 * Test Script for WordPress-to-Make.com User Sync
 * 
 * Instructions:
 * 1. Upload this file to your WordPress root directory or wp-content/plugins/
 * 2. Run it via browser: https://yourdomain.com/test-wordpress-sync.php
 * 3. Or run via WP-CLI: wp eval-file test-wordpress-sync.php
 * 4. Check debug.log for detailed output
 * 
 * This will test if the sync function works without creating a real user
 */

// Load WordPress
require_once('./wp-load.php');

if (!function_exists('initiate_sync_user_to_make')) {
    die('ERROR: initiate_sync_user_to_make function not found. Is the snippet active?');
}

echo "<h1>WordPress to Make.com Sync Test</h1>\n";
echo "<pre>\n";

// Test 1: Check if function exists
echo "✓ Test 1: Function exists - initiate_sync_user_to_make\n\n";

// Test 2: Get the most recent user to test with
$recent_users = get_users(array(
    'number' => 5,
    'orderby' => 'registered',
    'order' => 'DESC'
));

if (empty($recent_users)) {
    die('ERROR: No users found in WordPress database');
}

echo "Test 2: Recent users found:\n";
foreach ($recent_users as $user) {
    $synced_from = get_user_meta($user->ID, 'synced_from', true);
    $ph_user_id = get_user_meta($user->ID, 'ph_user_id', true);
    
    echo sprintf(
        "  - ID: %d | Email: %s | Registered: %s | synced_from: %s | ph_user_id: %s\n",
        $user->ID,
        $user->user_email,
        $user->user_registered,
        $synced_from ?: 'none',
        $ph_user_id ?: 'none'
    );
}

// Test 3: Select a user to sync
$test_user = $recent_users[0];
echo "\n✓ Test 3: Selected test user - ID: {$test_user->ID}, Email: {$test_user->user_email}\n\n";

// Test 4: Check if user should be synced (not from PH)
$synced_from = get_user_meta($test_user->ID, 'synced_from', true);
$ph_user_id = get_user_meta($test_user->ID, 'ph_user_id', true);

if ($synced_from === 'PH' || !empty($ph_user_id)) {
    echo "⚠ Test 4: This user was synced FROM InitiatePH (loop protection will skip it)\n";
    echo "   Trying next user...\n\n";
    
    foreach ($recent_users as $user) {
        $synced_from = get_user_meta($user->ID, 'synced_from', true);
        $ph_user_id = get_user_meta($user->ID, 'ph_user_id', true);
        
        if ($synced_from !== 'PH' && empty($ph_user_id)) {
            $test_user = $user;
            echo "✓ Found eligible user - ID: {$test_user->ID}, Email: {$test_user->user_email}\n\n";
            break;
        }
    }
}

// Test 5: Get webhook URL
$webhook_url = defined('MAKE_WEBHOOK_URL_GLOBAL_TO_PH') 
    ? MAKE_WEBHOOK_URL_GLOBAL_TO_PH 
    : 'https://hook.us2.make.com/x449d7ngzxgye64638dc9yqle76z49pk';

echo "✓ Test 5: Webhook URL configured\n";
echo "   URL: " . substr($webhook_url, 0, 50) . "...\n\n";

// Test 6: Build test payload (same as actual function)
$user_data = get_userdata($test_user->ID);
$payload = array(
    'source_system' => 'GLOBAL',
    'source_event_id' => wp_generate_uuid4(),
    'source_timestamp' => current_time('c'),
    'user' => array(
        'email' => $user_data->user_email,
        'first_name' => $user_data->first_name,
        'last_name' => $user_data->last_name,
        'phone_number' => get_user_meta($test_user->ID, 'phone_number', true),
        'global_user_id' => $test_user->ID,
        'username' => $user_data->user_login,
        'display_name' => $user_data->display_name
    )
);

echo "✓ Test 6: Payload prepared\n";
echo json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

// Test 7: Actually trigger the sync function
echo "⏳ Test 7: Calling initiate_sync_user_to_make()...\n";
echo "   (Check debug.log for detailed output)\n\n";

// Call the actual sync function
initiate_sync_user_to_make($test_user->ID);

echo "✓ Test 7: Function call completed\n\n";

// Test 8: Direct webhook test (bypass WordPress function)
echo "⏳ Test 8: Testing direct webhook call...\n";

$response = wp_remote_post($webhook_url, array(
    'method' => 'POST',
    'timeout' => 15,
    'blocking' => true,
    'headers' => array('Content-Type' => 'application/json'),
    'body' => json_encode($payload),
    'sslverify' => true
));

if (is_wp_error($response)) {
    echo "✗ ERROR: " . $response->get_error_message() . "\n";
    echo "   Error Code: " . $response->get_error_code() . "\n";
} else {
    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    
    if ($status_code >= 200 && $status_code < 300) {
        echo "✓ SUCCESS: Webhook responded with status {$status_code}\n";
        echo "   Response: {$body}\n";
    } else {
        echo "✗ ERROR: Webhook returned status {$status_code}\n";
        echo "   Response: {$body}\n";
    }
}

echo "\n";
echo "========================================\n";
echo "Test completed! Check debug.log for detailed logs.\n";
echo "========================================\n";
echo "</pre>";

// Also log to error_log
error_log('=== WordPress Sync Test Completed ===');
error_log('Test user ID: ' . $test_user->ID);
error_log('Test user email: ' . $test_user->user_email);
error_log('======================================');
