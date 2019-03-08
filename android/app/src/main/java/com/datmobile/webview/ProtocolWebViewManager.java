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
import com.reactnativecommunity.webview.RNCWebViewManager;

import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.annotation.Nullable;

@ReactModule(name = ProtocolWebViewManager.REACT_CLASS)
public class ProtocolWebViewManager extends RNCWebViewManager {
    public static final int COMMAND_RESPOND_DATA = 101;
    public static final int COMMAND_RESPOND_FINISH = 102;
    public static final int COMMAND_RESPOND_INFO = 103;

    /* This name must match what we're referring to in JS */
    protected static final String REACT_CLASS = "ProtocolWebView";

    ProtocolWebViewClient mReactWebViewClient = null;

    protected static class PendingRequest {
      WebResourceRequest request;
      WebResourceResponse response;
      WebView view;
      PipedOutputStream stream;

      PendingRequest(WebView view, WebResourceRequest request, WebResourceResponse response, PipedOutputStream stream) {
        this.view = view;
        this.request = request;
        this.response = response;
        this.stream = stream;
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
                // Data should be base64 encoded
                String base64String = args.getString(1);
                byte[] data = Base64.decode(base64String, Base64.NO_WRAP);
                requestId = args.getInt(0);
                mReactWebViewClient.writeToResponse(requestId, data);
                break;
            case COMMAND_RESPOND_FINISH:
                requestId = args.getInt(0);
                mReactWebViewClient.finishResponse(requestId);
                break;
            case COMMAND_RESPOND_INFO:
                requestId = args.getInt(0);
                String mime = args.size() > 1 ? args.getString(1) : "text/plain";
                int status = args.size() > 2 ? args.getInt(2) : 200;
                mReactWebViewClient.setResponseInfo(requestId, mime, status);
                break;
        }

        super.receiveCommand(root, commandId, args);
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
        Set<String> customSchemes = new HashSet<String>();
        Map<Integer, PendingRequest> pendingRequests = new HashMap<Integer, PendingRequest>();

        public void writeToResponse(int requestId, byte[] responseData) {
          PendingRequest pending = pendingRequests.get(requestId);
          if(pending == null) {
            return;
          };

          try {
              pending.stream.write(responseData);
          } catch (IOException e) {
              // Not sure what to do
          }

        }

        public void finishResponse(int requestId) {
          PendingRequest pending = pendingRequests.get(requestId);
          if(pending == null) {
            return;
          }

          try {
            pending.stream.close();
          } catch (IOException e) {
              // Not sure what to do
          }
        }

        public  void setResponseInfo(int requestId, String mimeType, int status) {
            PendingRequest pending = pendingRequests.get(requestId);
            if(pending == null) {
                return;
            };

            pending.response.setMimeType(mimeType);
            pending.response.setStatusCodeAndReasonPhrase(status, "Some nonempty phrase");
        }

        @Override
        public WebResourceResponse shouldInterceptRequest (WebView view, WebResourceRequest request) {
          Uri url = request.getUrl();
          String scheme = url.getScheme();

          if(!customSchemes.contains(scheme)) return super.shouldInterceptRequest(view, request);

          PipedOutputStream outputStream = new PipedOutputStream();
          PipedInputStream inputStream;
          try {
            inputStream = new PipedInputStream(outputStream);
          } catch (IOException e) {
            return super.shouldInterceptRequest(view, request);
          }
          WebResourceResponse response = new WebResourceResponse("text/plain", null, inputStream);

          PendingRequest pending = new PendingRequest(view, request, response, outputStream);

          int requestId = pending.hashCode();
          pendingRequests.put(requestId, pending);

          dispatchEvent(view, new ProtocolHandleStartEvent(view.getId(), requestId, url.toString(), request.getMethod()));

          return response;
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
