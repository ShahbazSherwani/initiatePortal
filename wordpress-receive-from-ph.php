<?php
/**
 * WordPress Snippet: Receive User from InitiatePH via Make.com
 * Add this to InitiateGlobal WordPress via Code Snippets plugin
 * 
 * Creates a REST API endpoint that Make.com can call to create/update users
 * 
 * Endpoint: POST /wp-json/initiate/v1/sync-user
 * Required Header: X-API-Key (must match INITIATE_SYNC_API_KEY)
 */

// Define API key - Add to wp-config.php: define('INITIATE_SYNC_API_KEY', 'your-secret-key');
if (!defined('INITIATE_SYNC_API_KEY')) {
    define('INITIATE_SYNC_API_KEY', '19dec8BE4b3605F2fAaD7C3496b7E10a58Fd1c2A9e4f6B8d3C5A7E2F0948DbCa');
}

// Register REST API endpoint
add_action('rest_api_init', function() {
    register_rest_route('initiate/v1', '/sync-user', array(
        'methods' => 'POST',
        'callback' => 'initiate_sync_user_from_ph',
        'permission_callback' => 'initiate_verify_api_key'
    ));
    
    register_rest_route('initiate/v1', '/check-user', array(
        'methods' => 'POST',
        'callback' => 'initiate_check_user',
        'permission_callback' => 'initiate_verify_api_key'
    ));
});

// Verify API key
function initiate_verify_api_key($request) {
    $api_key = $request->get_header('X-API-Key');
    
    if ($api_key !== INITIATE_SYNC_API_KEY) {
        error_log('Initiate Sync: Invalid API key received');
        return new WP_Error('unauthorized', 'Invalid API key', array('status' => 401));
    }
    
    return true;
}

// Check if user exists
function initiate_check_user($request) {
    $params = $request->get_json_params();
    $email = sanitize_email($params['email'] ?? '');
    
    if (empty($email)) {
        return new WP_REST_Response(array(
            'error' => 'Email is required'
        ), 400);
    }
    
    $user = get_user_by('email', $email);
    
    if ($user) {
        return new WP_REST_Response(array(
            'exists' => true,
            'user_id' => $user->ID,
            'username' => $user->user_login
        ), 200);
    }
    
    return new WP_REST_Response(array(
        'exists' => false
    ), 200);
}

// Sync/create user from InitiatePH
function initiate_sync_user_from_ph($request) {
    $params = $request->get_json_params();
    
    error_log('Initiate Sync from PH: Received payload - ' . json_encode($params));
    
    // Extract user data
    $email = sanitize_email($params['email'] ?? '');
    $first_name = sanitize_text_field($params['first_name'] ?? '');
    $last_name = sanitize_text_field($params['last_name'] ?? '');
    $full_name = sanitize_text_field($params['full_name'] ?? '');
    $phone_number = sanitize_text_field($params['phone_number'] ?? '');
    $firebase_uid = sanitize_text_field($params['firebase_uid'] ?? '');
    $ph_user_id = sanitize_text_field($params['ph_user_id'] ?? '');
    $source_system = sanitize_text_field($params['source_system'] ?? '');
    $source_event_id = sanitize_text_field($params['source_event_id'] ?? '');
    
    // Validate required fields
    if (empty($email)) {
        error_log('Initiate Sync from PH: Missing email');
        return new WP_REST_Response(array(
            'error' => 'Email is required'
        ), 400);
    }
    
    // Loop protection - don't process if it came from WordPress
    if ($source_system === 'GLOBAL') {
        error_log('Initiate Sync from PH: Loop protection - ignoring GLOBAL source');
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Loop protection: ignored'
        ), 200);
    }
    
    // Check if user already exists
    $existing_user = get_user_by('email', $email);
    
    if ($existing_user) {
        // UPDATE existing user
        $user_id = $existing_user->ID;
        
        // Update user meta
        if (!empty($first_name)) {
            update_user_meta($user_id, 'first_name', $first_name);
            wp_update_user(array('ID' => $user_id, 'first_name' => $first_name));
        }
        if (!empty($last_name)) {
            update_user_meta($user_id, 'last_name', $last_name);
            wp_update_user(array('ID' => $user_id, 'last_name' => $last_name));
        }
        if (!empty($phone_number)) {
            update_user_meta($user_id, 'phone_number', $phone_number);
        }
        if (!empty($firebase_uid)) {
            update_user_meta($user_id, 'firebase_uid', $firebase_uid);
        }
        if (!empty($ph_user_id)) {
            update_user_meta($user_id, 'ph_user_id', $ph_user_id);
        }
        
        // Mark as synced from PH to prevent loop
        update_user_meta($user_id, 'synced_from', 'PH');
        update_user_meta($user_id, 'last_sync_from_ph', current_time('mysql'));
        
        error_log('Initiate Sync from PH: Updated existing user - ID: ' . $user_id);
        
        return new WP_REST_Response(array(
            'success' => true,
            'action' => 'updated',
            'user_id' => $user_id,
            'message' => 'User profile updated'
        ), 200);
        
    } else {
        // CREATE new user
        
        // Generate username from email
        $username = sanitize_user(explode('@', $email)[0], true);
        
        // Make username unique
        $original_username = $username;
        $counter = 1;
        while (username_exists($username)) {
            $username = $original_username . $counter;
            $counter++;
        }
        
        // Generate random password (user will reset via email)
        $password = wp_generate_password(16, true, true);
        
        // Create display name
        $display_name = $full_name;
        if (empty($display_name)) {
            $display_name = trim($first_name . ' ' . $last_name);
        }
        if (empty($display_name)) {
            $display_name = $username;
        }
        
        // Create user
        $user_id = wp_insert_user(array(
            'user_login' => $username,
            'user_email' => $email,
            'user_pass' => $password,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => $display_name,
            'role' => 'subscriber' // Default role
        ));
        
        if (is_wp_error($user_id)) {
            error_log('Initiate Sync from PH: Failed to create user - ' . $user_id->get_error_message());
            return new WP_REST_Response(array(
                'error' => 'Failed to create user',
                'details' => $user_id->get_error_message()
            ), 500);
        }
        
        // Add user meta
        if (!empty($phone_number)) {
            update_user_meta($user_id, 'phone_number', $phone_number);
        }
        if (!empty($firebase_uid)) {
            update_user_meta($user_id, 'firebase_uid', $firebase_uid);
        }
        if (!empty($ph_user_id)) {
            update_user_meta($user_id, 'ph_user_id', $ph_user_id);
        }
        
        // Mark as synced from PH to prevent loop
        update_user_meta($user_id, 'synced_from', 'PH');
        update_user_meta($user_id, 'created_by_sync', current_time('mysql'));
        
        error_log('Initiate Sync from PH: Created new user - ID: ' . $user_id . ', Username: ' . $username);
        
        // Optionally send password reset email
        // wp_new_user_notification($user_id, null, 'user');
        
        return new WP_REST_Response(array(
            'success' => true,
            'action' => 'created',
            'user_id' => $user_id,
            'username' => $username,
            'message' => 'User created successfully'
        ), 201);
    }
}

error_log('Initiate Sync from PH: REST API endpoint registered - /wp-json/initiate/v1/sync-user');
