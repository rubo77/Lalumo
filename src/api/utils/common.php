<?php

// Debug-Log erstellen mit PHP error_log
function debugLog($message) {
    $timestamp = date('Y-m-d H:i:s');
    error_log("[REFERRAL_DEBUG][$timestamp] $message\n");
}
