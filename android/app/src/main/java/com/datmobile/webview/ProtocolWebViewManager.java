package com.datmobile.webview;

import android.webkit.WebView;

import com.facebook.react.uimanager.ThemedReactContext;
import com.reactnativecommunity.webview.RNCWebViewManager;
import com.reactnativecommunity.webview.ReactWebViewClient;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.Promise;

import java.util.HashSet;
import java.util.Set;

@ReactModule(name = ProtocolWebViewManager.REACT_CLASS)
public class ProtocolWebViewManager extends RNCWebViewManager {
  /* This name must match what we're referring to in JS */
  protected static final String REACT_CLASS = "ProtocolWebView";

  ReactWebViewClient mReactWebViewClient = null;

  class ProtocolWebViewClient extends ReactWebViewClient {
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

    Set<String> customSchemes = new HashSet<String>();
    Map<int, PendingRequest> pendingRequests = new HashMap<String, PendingRequest>();

    public void registerProtocol(String scheme) {
      if(customSchemes.contains(scheme)) {
        throw new Exception("Already Registered");
        return;
      }

      customSchemes.add(scheme);
    }

    public void unregisterProtocol(String scheme) {
      customSchemes.remove(scheme);
    }

    public void writeToResponse(int requestId, byte[] responseData) {
      PendingRequest pending = pendingRequests.get(requestId);
      if(pending === null) {
        return;
      }

      PipedOutputStream stream = mResponseMap.get(requestId);
      
      pending.stream.write(responseData);
    }

    public void finishResponse(int requestId) {
      PendingRequest pending = pendingRequests.get(requestId);
      if(pending === null) {
        return;
      }

      pending.stream.close();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest (WebView view, WebResourceRequest request) {
      Uri url = request.getUrl();
      String scheme = url.getScheme();

      if(!customSchemes.contains(scheme)) return super.shouldInterceptRequest(view, request);
      
      PipedOutputStream outputStream = new PipedOutputStream();
      PipedInputStream inputStream = new PipedInputStream(outputStream);
      WebResourceResponse response = new WebResourceResponse('text', null, inputStream);

      PendingRequest pending = new PendingRequest(view, request, outputStream);

      int requestId = pending.hashCode();
      pendingRequests.set(requestId, pending);

      dispatchEvent(view, new ProtocolHandleStartEvent(webView.getId(), requestId))

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