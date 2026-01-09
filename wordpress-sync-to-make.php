<?php
/**
 * WordPress Snippet: Sync User to Make.com on Registration
 * Add this to InitiateGlobal WordPress via Code Snippets plugin
 * 
 * Triggers: When a new user is created in WordPress
 * Action: Sends user data to Make.com webhook
 * Result: User gets created in InitiatePH via Make automation
 */

// Fire webhook to Make when user is created
add_action('user_register', 'initiate_sync_user_to_make', 10, 1);

function initiate_sync_user_to_make($user_id) {
    // Get user data
    $user = get_userdata($user_id);
    
    if (!$user) {
        error_log('InitiateGlobal Sync: User not found - ID: ' . $user_id);
        return;
    }
    
    // Check if user was synced FROM InitiatePH (prevent loop)
    $synced_from = get_user_meta($user_id, 'synced_from', true);
    $ph_user_id = get_user_meta($user_id, 'ph_user_id', true);
    
    if ($synced_from === 'PH' || !empty($ph_user_id)) {
        error_log('InitiateGlobal Sync: Loop protection - User came from PH, not syncing back');
        return;
    }
    
    // Get additional user data
    $first_name = $user->first_name;
    $last_name = $user->last_name;
    $phone_number = get_user_meta($user_id, 'phone_number', true);
    
    // Get Make webhook URL from wp-config or define here
    $make_webhook_url = defined('MAKE_WEBHOOK_URL_GLOBAL_TO_PH') 
        ? MAKE_WEBHOOK_URL_GLOBAL_TO_PH 
        : 'https://hook.us2.make.com/x449d7ngzxgye64638dc9yqle76z49pk';
    
    // Prepare payload
    $payload = array(
        'source_system' => 'GLOBAL',
        'source_event_id' => wp_generate_uuid4(),
        'source_timestamp' => current_time('c'),
        'user' => array(
            'email' => $user->user_email,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'phone_number' => $phone_number,
            'global_user_id' => $user_id,
            'username' => $user->user_login,
            'display_name' => $user->display_name
        )
    );
    
    // Log the sync attempt
    error_log('InitiateGlobal Sync: Sending user to Make.com - Email: ' . $user->user_email);
    
    // Call Make webhook (non-blocking)
    $response = wp_remote_post($make_webhook_url, array(
        'method' => 'POST',
        'timeout' => 10,
        'blocking' => false, // Don't wait for response
        'headers' => array(
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode($payload),
        'sslverify' => true
    ));
    
    // Log result (only if blocking was true)
    if (is_wp_error($response)) {
        error_log('InitiateGlobal Sync: Webhook error - ' . $response->get_error_message());
    }
}

// Optional: Add admin notice when sync happens
add_action('admin_notices', 'initiate_sync_admin_notice');

function initiate_sync_admin_notice() {
    if (isset($_GET['user_id']) && current_user_can('edit_users')) {
        $user_id = intval($_GET['user_id']);
        $synced_from = get_user_meta($user_id, 'synced_from', true);
        
        if ($synced_from === 'PH') {
            echo '<div class="notice notice-info"><p>';
            echo '<strong>User Sync:</strong> This user was synced from InitiatePH.';
            echo '</p></div>';
        }
    }
}

// Optional: Add REST endpoint to manually trigger sync
add_action('rest_api_init', function() {
    register_rest_route('initiate/v1', '/sync-user/(?P<id>\d+)', array(
        'methods' => 'POST',
        'callback' => 'initiate_manual_sync_user',
        'permission_callback' => function() {
            return current_user_can('edit_users');
        }
    ));
});

function initiate_manual_sync_user($request) {
    $user_id = $request['id'];
    
    // Call the sync function
    initiate_sync_user_to_make($user_id);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Sync triggered for user ID: ' . $user_id
    ), 200);
}

// Store Make webhook URL in options (for easy updating)
// You can set this via wp-config.php: define('MAKE_WEBHOOK_URL_GLOBAL_TO_PH', 'https://...');
// Or add to database:
// update_option('initiate_make_webhook_url', 'https://hook.us1.make.com/...');
