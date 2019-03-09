package com.datmobile.webview;

import android.net.Uri;
import android.util.Base64;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.koushikdutta.async.util.Charsets;
import com.reactnativecommunity.webview.RNCWebViewManager;

import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.annotation.Nullable;

@ReactModule(name = ProtocolWebViewManager.REACT_CLASS)
public class ProtocolWebViewManager extends RNCWebViewManager {
    public static final int COMMAND_RESPOND_DATA = 101;
    public static final int COMMAND_RESPOND_FINISH = 102;
    public static final int COMMAND_RESPOND_INFO = 103;

    /* This name must match what we're referring to in JS */
    protected static final String REACT_CLASS = "ProtocolWebView";

    // How long we should wait before aborting responses
    private static final long SHOULD_INTERCEPT_REQUEST_TIMEOUT_MS = 5000;

    private static final String ERROR_RESPONSE_TIMEOUT = "Request timed out";

    ProtocolWebViewClient mReactWebViewClient = null;

    private final Map<Integer, BlockingQueue<WebResourceResponse>> requestQueueMap = new HashMap<>();
    Map<Integer, PendingRequest> pendingRequests = new HashMap<Integer, PendingRequest>();


    protected static class PendingRequest {
      private WebResourceResponse response;
      private PipedOutputStream stream;
      private boolean madeResponse = false;

      static WebResourceResponse fromMessage(String message) {
          PendingRequest pending = new PendingRequest();
          WebResourceResponse response = pending.makeResponse("text/plain", 404);
          pending.write(message.getBytes(Charsets.UTF_8));
          pending.finish();
          return response;
      }

      WebResourceResponse makeResponse(String mimeType, int status) {
          if(madeResponse) return this.response;
          this.madeResponse = true;

          stream = new PipedOutputStream();
          PipedInputStream inputStream = null;
          try {
              inputStream = new PipedInputStream(stream);
          } catch (IOException e) {
             // Ruh roh
          }
          WebResourceResponse response = new WebResourceResponse(mimeType, null, inputStream);

          response.setStatusCodeAndReasonPhrase(status, "Some none empty phrase");
          this.response = response;

          return response;
      }

      void write(byte[] data) {
          try {
              stream.write(data);
          } catch (IOException e) {
              // Not sure what to do
          }
      }

      void write(String base64String) {
          byte[] data = Base64.decode(base64String, Base64.NO_WRAP);

          this.write(data);
      }

      void finish() {
          try {
              stream.close();
          } catch (IOException e) {
              // Not sure what to do
          }
      }
    }

    @ReactProp(name = "schemes")
    public void setSchemes(WebView view, @Nullable ReadableArray schemes) {
      mReactWebViewClient.customSchemes.clear();

      int size = schemes.size();

      for(int i = 0; i < size; i++) {
        mReactWebViewClient.customSchemes.add(schemes.getString(i));
      }
    }

    @Override
    public @Nullable
    Map<String, Integer> getCommandsMap() {
        Map<String, Integer> commands = super.getCommandsMap();

        commands.put("_respondData", COMMAND_RESPOND_DATA);
        commands.put("_respondFinish", COMMAND_RESPOND_FINISH);
        commands.put("_respondInfo", COMMAND_RESPOND_INFO);

        return commands;
    }

    @Override
    public void receiveCommand(WebView root, int commandId, @Nullable ReadableArray args) {
        int requestId;
        switch (commandId) {
            case COMMAND_RESPOND_DATA:
                requestId = args.getInt(0);
                // Data should be base64 encoded
                String base64String = args.getString(1);
                respondData(requestId, base64String);
                break;
            case COMMAND_RESPOND_FINISH:
                requestId = args.getInt(0);
                finishResponse(requestId);
                break;
            case COMMAND_RESPOND_INFO:
                requestId = args.getInt(0);
                String mime = args.size() > 1 ? args.getString(1) : "text/plain";
                int status = args.size() > 2 ? args.getInt(2) : 200;
                responseInfo(requestId, mime, status);
                break;
        }

        super.receiveCommand(root, commandId, args);
    }

    private void respondData(int requestId, String base64String) {
        PendingRequest pending = pendingRequests.get(requestId);
        if(pending == null) {
            return;
        };

        pending.write(base64String);
    }

    private void finishResponse(int requestId) {
        PendingRequest pending = pendingRequests.get(requestId);
        if(pending == null) {
            return;
        };

        pending.finish();

        pendingRequests.remove(requestId);
    }

    private void responseInfo(int requestId, String mimeType, int status) {
        PendingRequest pending = pendingRequests.get(requestId);
        if(pending == null) {
            return;
        };

        WebResourceResponse response = pending.makeResponse(mimeType, status);

        BlockingQueue queue = requestQueueMap.get(requestId);

        if(queue == null) {
            // Got response info for an invalid response
            return;
        }

        queue.offer(response);
    }

    @Override
    public @Nullable
    Map getExportedCustomDirectEventTypeConstants() {
        Map<String, Object> export = super.getExportedCustomDirectEventTypeConstants();
        if (export == null) {
            export = MapBuilder.newHashMap();
        }
        export.put("onProtocolHandleStart", MapBuilder.of("registrationName", "onProtocolHandleStart"));
        return export;
    }

    class ProtocolWebViewClient extends RNCWebViewManager.RNCWebViewClient {
        Set<String> customSchemes = new HashSet<>();

        @Override
        public WebResourceResponse shouldInterceptRequest (WebView view, WebResourceRequest request) {
          Uri url = request.getUrl();
          String scheme = url.getScheme();

          if(!customSchemes.contains(scheme)) return super.shouldInterceptRequest(view, request);

          PendingRequest pending = new PendingRequest();

          int requestId = pending.hashCode();

          pendingRequests.put(requestId, pending);

          BlockingQueue<WebResourceResponse> queue = new LinkedBlockingQueue<>(1);

          requestQueueMap.put(requestId, queue);
          try {

            dispatchEvent(view, new ProtocolHandleStartEvent(view.getId(), requestId, url.toString(), request.getMethod()));

            WebResourceResponse response = queue.poll(SHOULD_INTERCEPT_REQUEST_TIMEOUT_MS, TimeUnit.MILLISECONDS);

            if(response == null)
              return PendingRequest.fromMessage(ERROR_RESPONSE_TIMEOUT);

            return response;
          } catch (InterruptedException e) {
              e.printStackTrace();
              return PendingRequest.fromMessage(ERROR_RESPONSE_TIMEOUT);
          } finally {
            requestQueueMap.remove(requestId);
          }
        }
    }

    protected static class ProtocolWebView extends RNCWebView {
        public ProtocolWebView(ThemedReactContext reactContext) {
      super(reactContext);
    }
    }

    @Override
    protected RNCWebView createRNCWebViewInstance(ThemedReactContext reactContext) {
        return new ProtocolWebView(reactContext);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected void addEventEmitters(ThemedReactContext reactContext, WebView view) {
        mReactWebViewClient = new ProtocolWebViewClient();
        view.setWebViewClient(mReactWebViewClient);
    }
}
