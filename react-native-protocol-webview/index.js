import { NativeModules } from 'react-native'

import { WebView } from 'react-native-webview'


export default class ProtocolWebView {
	static propTypes = WebView.propTypes;

	static protocolHandlers = {};

	static registerStreamProtocol = (scheme, handler, completion) => {
		NativeModules.ProtocolWebView.registerProtocol(scheme).then(() => {
			WebView.protocolHandlers[scheme] = (request, id) => {
				// Request has .url and .method
				handler(request, (err, stream) => {
					if (err) return NativeModules.ProtocolWebView.finishResponse(id)
					if (!stream.on) stream = stream.data

					stream.once('close', () => NativeModules.ProtocolWebView.finishResponse(id))
					stream.on('data', (data) => NativeModules.ProtocolWebView.respondeWithData(id, data.buffer))
					stream.once('error', () => NativeModules.ProtocolWebView.finishResponse(id))
					if (stream.resume) stream.resume()
				})
			}
			if (typeof completion === 'function') completion(null)
		}, completion)
	};

	static unregisterProtocol = (scheme, completion) => {
		NativeModules.ProtocolWebView.unregisterProtocol(scheme).then(() => {
			delete WebView.protocolHandlers[scheme]
			if (typeof completion === 'function') completion(null)
		}, completion)
	}

	render() {
		return (
			<WebView {...this.props} nativeConfig={{ component: ProtocolWebView }} />
		);
	}
}

const ProtocolWebView = requireNativeComponent(
	'ProtocolWebView',
	CustomWebView,
	WebView.extraNativeComponentConfig
);