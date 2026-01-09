<?php
// Diagnostic script to check JetEngine user context
// Upload to WordPress root and access via: https://initiateglobal.org/check-jetengine-user.php

require_once('wp-load.php');

// Check if user is logged in
echo "<h2>WordPress User Session</h2>";
if (is_user_logged_in()) {
    $current_user = wp_get_current_user();
    echo "✓ User is logged in<br>";
    echo "User ID: " . $current_user->ID . "<br>";
    echo "User Email: " . $current_user->user_email . "<br>";
    echo "Display Name: " . $current_user->display_name . "<br>";
    
    // Check user meta
    echo "<h3>User Meta</h3>";
    $jet_cct_id = get_user_meta($current_user->ID, 'jet_cct_id', true);
    $cct_users_id = get_user_meta($current_user->ID, '_cct_users_id', true);
    
    echo "jet_cct_id: " . ($jet_cct_id ? $jet_cct_id : 'NULL') . "<br>";
    echo "_cct_users_id: " . ($cct_users_id ? $cct_users_id : 'NULL') . "<br>";
    
    // Check CCT record
    echo "<h3>CCT Record</h3>";
    global $wpdb;
    $cct_record = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}jet_cct_users WHERE email = %s",
        $current_user->user_email
    ));
    
    if ($cct_record) {
        echo "✓ CCT Record Found<br>";
        echo "CCT ID: " . $cct_record->_ID . "<br>";
        echo "First Name: " . ($cct_record->first_name ?: '(empty)') . "<br>";
        echo "Last Name: " . ($cct_record->last_name ?: '(empty)') . "<br>";
    } else {
        echo "✗ No CCT record found<br>";
    }
    
    // Check JetEngine
    echo "<h3>JetEngine Status</h3>";
    if (function_exists('jet_engine')) {
        echo "✓ JetEngine is active<br>";
        
        // Try to get the item ID that JetEngine would use
        if (class_exists('Jet_Engine_Profile_Builder')) {
            $profile_builder = \Jet_Engine\Modules\Profile_Builder\Module::instance();
            echo "✓ Profile Builder module is active<br>";
        }
    } else {
        echo "✗ JetEngine is not active<br>";
    }
    
} else {
    echo "✗ No user is logged in<br>";
    echo "<br><a href='" . wp_login_url() . "'>Login</a>";
}
?>
