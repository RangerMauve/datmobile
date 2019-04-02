package com.datmobile;

import android.app.Application;

import com.bitgo.randombytes.RandomBytesPackage;
import com.datmobile.BuildConfig;
import com.facebook.react.ReactApplication;
import com.reactlibrary.RNRandomAccessRnFilePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.peel.react.TcpSocketsModule;
import com.peel.react.rnos.RNOSModule;
import com.tradle.react.UdpSocketsModule;
import com.reactnativecommunity.webview.RNCWebViewPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNRandomAccessRnFilePackage(),
            new RNOSModule(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new RNCWebViewPackage(),
            new RandomBytesPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
