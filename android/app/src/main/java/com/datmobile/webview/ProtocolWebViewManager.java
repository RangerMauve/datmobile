package com.datmobile.webview;

import android.net.Uri;
import android.util.Base64;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
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
    public static final int COMMAND_REGISTER_PROTOCOL = 103;
    public static final int COMMAND_UNREGISTER_PROTOCOL = 104;

    /* This name must match what we're referring to in JS */
    protected static final String REACT_CLASS = "ProtocolWebView";

    ProtocolWebViewClient mReactWebViewClient = null;

    protected static class PendingRequest {
      WebResourceRequest request;
      WebView view;
      PipedOutputStream stream;

      PendingRequest(WebView view, WebResourceRequest request, PipedOutputStream stream) {
        this.view = view;
        this.request = request;
        this.stream = stream;
      }
    }

    @Override
    public @Nullable
    Map<String, Integer> getCommandsMap() {
        Map<String, Integer> commands = super.getCommandsMap();

        commands.put("_respondData", COMMAND_RESPOND_DATA);
        commands.put("_respondFinish", COMMAND_RESPOND_FINISH);
        commands.put("_registerProtocol", COMMAND_REGISTER_PROTOCOL);
        commands.put("_unregisterProtocol", COMMAND_UNREGISTER_PROTOCOL);

        return commands;
    }

    @Override
    public void receiveCommand(WebView root, int commandId, @Nullable ReadableArray args) {
        int requestId;
        String scheme;
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
            case COMMAND_REGISTER_PROTOCOL:
                scheme = args.getString(0);
                mReactWebViewClient.registerProtocol(scheme);
                break;
            case COMMAND_UNREGISTER_PROTOCOL:
                scheme = args.getString(0);
                mReactWebViewClient.unregisterProtocol(scheme);
                break;
        }

        super.receiveCommand(root, commandId, args);
    }

  class ProtocolWebViewClient extends RNCWebViewManager.RNCWebViewClient {
    Set<String> customSchemes = new HashSet<String>();
    Map<Integer, PendingRequest> pendingRequests = new HashMap<Integer, PendingRequest>();

    public void registerProtocol(String scheme) {
      customSchemes.add(scheme);
    }

    public void unregisterProtocol(String scheme) {
      customSchemes.remove(scheme);
    }

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
      WebResourceResponse response = new WebResourceResponse("text", null, inputStream);

      PendingRequest pending = new PendingRequest(view, request, outputStream);

      int requestId = pending.hashCode();
      pendingRequests.put(requestId, pending);

      dispatchEvent(view, new ProtocolHandleStartEvent(view.getId(), requestId));

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
