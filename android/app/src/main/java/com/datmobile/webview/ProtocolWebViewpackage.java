package com.datmobile.webview;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.reactnativecommunity.webview.RNCWebViewManager;
import com.reactnativecommunity.webview.RNCWebViewModule;
import com.reactnativecommunity.webview.RNCWebViewPackage;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ProtocolWebViewpackage extends RNCWebViewPackage {
    private RNCWebViewModule module;

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        ProtocolWebViewManager mProtocolWebViewManager = new ProtocolWebViewManager();
        mProtocolWebViewManager.setPackage(this);

        RNCWebViewManager mRNCWebViewManager =  new RNCWebViewManager();
        mProtocolWebViewManager.setPackage(this);

        return Arrays.<ViewManager>asList(
                mProtocolWebViewManager,
                mRNCWebViewManager
        );
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modulesList = new ArrayList<>();
        module = new RNCWebViewModule(reactContext);
        module.setPackage(this);
        modulesList.add(module);
        return modulesList;
    }

    public RNCWebViewModule getModule() {
        return module;
    }

}