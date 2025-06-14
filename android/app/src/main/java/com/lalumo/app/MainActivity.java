package com.lalumo.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.speech.tts.TextToSpeech;
import android.speech.tts.TextToSpeech.OnInitListener;
import android.util.Log;
import java.util.HashMap;
import java.util.Locale;
import java.util.Set;
import java.util.List;
import android.webkit.ValueCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity implements OnInitListener {
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private static final String TAG = "LalumoBridge";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable fullscreen mode - hide both status bar and navigation bar
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // For newer Android versions (API level 19+), better immersive mode
        // This hides both the navigation bar and status bar
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);
        
        // JavaScript-Schnittstellen hinzufügen
        this.bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "AndroidTTS");
        this.bridge.getWebView().addJavascriptInterface(new MenuLockInterface(), "AndroidMenuLock");
        
        // Text-to-Speech initialisieren
        initTTS();
        
        // Inject JavaScript to notify the web app that native TTS is available
        this.bridge.getWebView().evaluateJavascript(
            "console.log('Native Android TTS bridge initialized');" +
            "if (window.androidTTSReady) { window.androidTTSReady(); }", null);
    }
    
    /**
     * Initialisiert die Text-to-Speech Engine
     */
    private void initTTS() {
        Log.d(TAG, "Initializing Text-to-Speech engine");
        tts = new TextToSpeech(this, this);
    }
    
    @Override
    public void onInit(int status) {
        Log.d(TAG, "TTS initialization status: " + status);
        
        if (status == TextToSpeech.SUCCESS) {
            Log.d(TAG, "TTS engine initialized successfully");
            
            // Try to set German language
            int result = tts.setLanguage(Locale.GERMAN);
            Log.d(TAG, "Setting language to German, result: " + result);
            
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "German language not supported, falling back to default");
                // Try English as fallback
                result = tts.setLanguage(Locale.ENGLISH);
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    // Use device default as last resort
                    result = tts.setLanguage(Locale.getDefault());
                }
            }
            
            // Set speech properties
            tts.setPitch(1.2f); // Slightly higher for friendly sound
            tts.setSpeechRate(0.9f); // Slightly slower for better understanding
            
            ttsReady = true;
            
            // Test TTS with a simple message
            // HashMap<String, String> params = new HashMap<>();
            // params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "tts_test");
            // tts.speak("TTS Test erfolgreich", TextToSpeech.QUEUE_FLUSH, params);
            
            // Notify web app that TTS is ready
            runOnUiThread(() -> {
                bridge.getWebView().evaluateJavascript(
                    "console.log('Native TTS engine ready');" +
                    "if (window.androidTTSReady) { window.androidTTSReady(true); }", null);
            });
        } else {
            Log.e(TAG, "Failed to initialize TTS engine with status: " + status);
            
            // Notify web app about TTS failure
            runOnUiThread(() -> {
                bridge.getWebView().evaluateJavascript(
                    "console.log('Native TTS engine failed');" +
                    "if (window.androidTTSReady) { window.androidTTSReady(false); }", null);
            });
        }
    }
    
    /**
     * JavaScript-Schnittstelle für native Android-Funktionen
     */
    public class WebAppInterface {
        @JavascriptInterface
        public void speak(String text) {
            if (text == null || text.isEmpty()) {
                Log.e(TAG, "Cannot speak empty text");
                return;
            }
            
            Log.d(TAG, "Native TTS speak request: '" + text + "', ttsReady: " + ttsReady);
            
            if (ttsReady) {
                // Workaround für mögliche Async-Probleme: auf dem UI-Thread ausführen
                runOnUiThread(() -> {
                    try {
                        HashMap<String, String> params = new HashMap<>();
                        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "mascot_speech");
                        
                        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                        Log.d(TAG, "TTS speak result: " + result);
                        
                        // Notify web app about speech status
                        final int speakResult = result;
                        bridge.getWebView().evaluateJavascript(
                            "console.log('Native TTS speak result: " + speakResult + "');" +
                            "if (window.androidTTSCallback) { window.androidTTSCallback(" + speakResult + "); }", null);
                    } catch (Exception e) {
                        Log.e(TAG, "Error during TTS speak", e);
                    }
                });
            } else {
                Log.e(TAG, "Cannot speak, TTS engine not ready");
            }
        }
        
        @JavascriptInterface
        public boolean isTTSAvailable() {
            return ttsReady;
        }
        
        @JavascriptInterface
        public String getTTSStatus() {
            StringBuilder status = new StringBuilder();
            status.append("TTS Ready: ").append(ttsReady);
            
            if (tts != null) {
                status.append(", Engine: ").append(tts.getDefaultEngine());
                status.append(", Speaking: ").append(tts.isSpeaking());
            } else {
                status.append(", Engine: null");
            }
            
            return status.toString();
        }
    }
    
    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
    
    @Override
    public void onBackPressed() {
        Log.d(TAG, "Back button pressed, checking menu lock state");
        
        // Check if navigation is locked via JavaScript
        bridge.getWebView().evaluateJavascript(
            "(function() { " +
            "  if (window.Alpine && document.querySelector('[x-data]')) { " +
            "    var isMenuLocked = Alpine.store('app').menuLocked; " +
            "    return isMenuLocked; " +
            "  } else { " +
            "    return localStorage.getItem('lalumo_menu_locked') === 'true'; " +
            "  } " +
            "})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    // Strip quotes if present
                    value = value.replace("\"", "");
                    boolean isMenuLocked = Boolean.parseBoolean(value);
                    Log.d(TAG, "Menu lock state: " + isMenuLocked);
                    
                    if (!isMenuLocked) {
                        // If menu is not locked, navigate back to main menu
                        Log.d(TAG, "Navigation not locked, returning to main menu");
                        bridge.getWebView().evaluateJavascript(
                            "if (window.Alpine) { " +
                            "  Alpine.store('app').active = 'main'; " +
                            "} else { " +
                            "  window.location.hash = '#main'; " +
                            "}",
                            null
                        );
                    } else {
                        // If menu is locked, do nothing (default back behavior is prevented)
                        Log.d(TAG, "Navigation is locked, ignoring back button");
                    }
                }
            }
        );
    }
    
    /**
     * JavaScript-Schnittstelle für den Menü-Sperrzustand
     */
    public class MenuLockInterface {
        @JavascriptInterface
        public void setMenuLockState(boolean isLocked) {
            Log.d(TAG, "Menu lock state updated from JavaScript: " + isLocked);
        }
    }
}
