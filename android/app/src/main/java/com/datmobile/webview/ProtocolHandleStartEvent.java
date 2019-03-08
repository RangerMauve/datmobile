package com.datmobile.webview;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.reactnativecommunity.webview.events.TopMessageEvent;

public class ProtocolHandleStartEvent extends Event<TopMessageEvent> {
  private int requestId;
  private String url;
  private String method;

  public ProtocolHandleStartEvent(int viewTag, int requestId, String url, String method) {
    super(viewTag);
    this.requestId = requestId;
    this.url = url;
    this.method = method;
  }

  @Override
  public String getEventName() {
    return "protocolHandleStart";
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    init(getViewTag());
    WritableMap mParams = Arguments.createMap();

    mParams.putInt("request", this.requestId);
    mParams.putString("url", this.url);
    mParams.putString("method", this.method);

    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mParams);
  }
}
