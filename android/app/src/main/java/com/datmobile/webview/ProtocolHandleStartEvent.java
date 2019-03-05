package com.datmobile.webview;

// NavigationCompletedEvent.java
public class ProtocolHandleStartEvent extends Event<NavigationCompletedEvent> {
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
    WritableMap data = Arguments.createMap();
    data.putString("request", this.requestId);
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mParams);
  }
}