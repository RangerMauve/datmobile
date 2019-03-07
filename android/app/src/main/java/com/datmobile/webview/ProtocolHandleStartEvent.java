package com.datmobile.webview;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.reactnativecommunity.webview.events.TopMessageEvent;

// NavigationCompletedEvent.java
public class ProtocolHandleStartEvent extends Event<TopMessageEvent> {
  private int requestId;

  public ProtocolHandleStartEvent(int viewTag, int requestId) {
    super(viewTag);
    this.requestId = requestId;
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
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mParams);
  }
}