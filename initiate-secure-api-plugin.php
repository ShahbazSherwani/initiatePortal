<?php
/**
 * Plugin Name: Initiate Secure API
 * Plugin URI: https://initiateph.com
 * Description: Secure REST API endpoint for InitiatePH user synchronization
 * Version: 1.0.0
 * Author: Initiate Global Team
 * Author URI: https://initiateglobal.org
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register the secure REST API endpoint
 */
add_action('rest_api_init', function () {
    register_rest_route('initiate-secure/v1', '/create-user', array(
        'methods' => 'POST',
        'callback' => 'initiate_secure_create_user',
        'permission_callback' => 'initiate_verify_secure_auth',
        'args' => array(
            'email' => array(
                'required' => true,
                'type' => 'string',
                'validate_callback' => 'is_email',
                'sanitize_callback' => 'sanitize_email'
            ),
            'first_name' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'last_name' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'phone_number' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'account_type' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function($value) {
                    $allowed = array('investor', 'borrower', 'donor');
                    return in_array($value, $allowed);
                }
            )
        )
    ));
});

/**
 * SECURITY LAYER 1: Authentication verification
 */
function initiate_verify_secure_auth($request) {
    // Verify WordPress Application Password authentication
    $user = wp_get_current_user();
    
    if (!$user->exists()) {
        return new WP_Error(
            'auth_required',
            'Authentication required. Please provide valid credentials.',
            array('status' => 401)
        );
    }
    
    // Only allow the specific API user
    if ($user->user_login !== 'initiatead') {
        return new WP_Error(
            'forbidden',
            'Insufficient permissions. This endpoint is restricted.',
            array('status' => 403)
        );
    }
    
    // SECURITY LAYER 2: Rate limiting
    $rate_limit_check = initiate_check_rate_limit($request);
    if (is_wp_error($rate_limit_check)) {
        return $rate_limit_check;
    }
    
    // SECURITY LAYER 3: IP whitelist (optional - uncomment to enable)
    // $ip_check = initiate_check_ip_whitelist($request);
    // if (is_wp_error($ip_check)) {
    //     return $ip_check;
    // }
    
    return true;
}

/**
 * Rate limiting: Max 100 requests per hour per IP
 */
function initiate_check_rate_limit($request) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'initiate_rate_limit_' . md5($ip);
    $request_count = get_transient($transient_key);
    
    if ($request_count === false) {
        // First request in this hour
        set_transient($transient_key, 1, HOUR_IN_SECONDS);
        return true;
    }
    
    if ($request_count >= 100) {
        return new WP_Error(
            'rate_limit_exceeded',
            'Rate limit exceeded. Maximum 100 requests per hour allowed.',
            array('status' => 429)
        );
    }
    
    // Increment counter
    set_transient($transient_key, $request_count + 1, HOUR_IN_SECONDS);
    return true;
}

/**
 * IP Whitelist (OPTIONAL - Enable if you want extra security)
 * Uncomment this function and the call in initiate_verify_secure_auth()
 */
/*
function initiate_check_ip_whitelist($request) {
    $allowed_ips = array(
        // Add InitiatePH server IP here when they provide it
        // Example: '203.0.113.45'
    );
    
    $request_ip = $_SERVER['REMOTE_ADDR'];
    
    if (!empty($allowed_ips) && !in_array($request_ip, $allowed_ips)) {
        return new WP_Error(
            'ip_blocked',
            'Access denied. Your IP address is not whitelisted.',
            array('status' => 403)
        );
    }
    
    return true;
}
*/

/**
 * Main function: Create user in JetEngine CCT
 */
function initiate_secure_create_user($request) {
    global $wpdb;
    
    // Get sanitized parameters (already sanitized by WordPress REST API args)
    $params = $request->get_params();
    $email = $params['email'];
    $first_name = $params['first_name'];
    $last_name = $params['last_name'];
    $phone_number = $params['phone_number'];
    $account_type = $params['account_type'];
    
    // Additional validation
    if (strlen($first_name) < 2 || strlen($last_name) < 2) {
        return new WP_Error(
            'validation_failed',
            'First name and last name must be at least 2 characters.',
            array('status' => 400)
        );
    }
    
    // Check for duplicate email
    $table_name = $wpdb->prefix . 'jet_cct_users';
    $exists = $wpdb->get_row($wpdb->prepare(
        "SELECT _ID, email FROM {$table_name} WHERE email = %s",
        $email
    ));
    
    if ($exists) {
        return new WP_Error(
            'duplicate_user',
            'A user with this email already exists.',
            array(
                'status' => 409,
                'existing_user_id' => $exists->_ID,
                'existing_email' => $exists->email
            )
        );
    }
    
    // Prepare data for insertion (FIXED: Only fields that exist in the table)
    $data = array(
        'first_name' => $first_name,
        'last_name' => $last_name,
        'email' => $email,
        'phone_number' => $phone_number,
        'account_type' => $account_type
    );
    
    // Insert into database
    $inserted = $wpdb->insert(
        $table_name,
        $data,
        array('%s', '%s', '%s', '%s', '%s')
    );
    
    if ($inserted === false) {
        // Log error for debugging
        error_log('Initiate API Error: Failed to insert user - ' . $wpdb->last_error);
        
        return new WP_Error(
            'database_error',
            'Failed to create user. Please contact support.',
            array('status' => 500)
        );
    }
    
    $user_id = $wpdb->insert_id;
    
    // Audit log
    error_log(sprintf(
        'Initiate API: User created successfully - ID: %d, Email: %s, Type: %s, IP: %s',
        $user_id,
        $email,
        $account_type,
        $_SERVER['REMOTE_ADDR']
    ));
    
    // Return success response
    return new WP_REST_Response(array(
        'success' => true,
        '_ID' => (string) $user_id,
        'message' => 'User created successfully',
        'data' => array(
            'email' => $email,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'account_type' => $account_type,
            'created_at' => current_time('mysql')
        )
    ), 201);
}

/**
 * Add CORS headers (if needed for cross-origin requests)
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://initiateph.com');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
}, 15);
